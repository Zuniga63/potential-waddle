import { createHash } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { RateLimitError, InternalServerError, APIConnectionError } from '@anthropic-ai/sdk';
import { EnvironmentVariables } from 'src/config/app-config';
import { Menu } from '../entities/menu.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { KmizenService } from './kmizen.service';
import { AnthropicMenuExtractionService } from './anthropic-menu-extraction.service';
import { MenuDto } from '../dto/menu.dto';
import { derivePriceRangesFromMenu, deriveLowestHighest } from '../utils/derive-price-ranges';
import type { PriceRange } from '../interfaces/price-range.interface';
import type { MenuData } from '../interfaces/menu-extraction-result.interface';

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly kmizenService: KmizenService,
    private readonly anthropicMenuExtractionService: AnthropicMenuExtractionService,
  ) {}

  /**
   * Retry wrapper for transient Anthropic errors.
   * Retries ONLY on RateLimitError | InternalServerError | APIConnectionError.
   * Permanent errors rethrow immediately. Exhausted retries also rethrow.
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isTransient =
          err instanceof RateLimitError ||
          err instanceof InternalServerError ||
          err instanceof APIConnectionError;
        if (!isTransient || attempt === MAX_ATTEMPTS) throw err;
        lastError = err as Error;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
    throw lastError;
  }

  async findAllByRestaurant(restaurantId: string): Promise<MenuDto[]> {
    const menus = await this.menuRepository.find({
      where: { restaurant: { id: restaurantId } },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
    return menus.map((menu) => new MenuDto(menu));
  }

  async findLatest(restaurantId: string): Promise<MenuDto | null> {
    const menu = await this.menuRepository.findOne({
      where: { restaurant: { id: restaurantId }, status: 'completed' },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
    return menu ? new MenuDto(menu) : null;
  }

  async findOne(menuId: string): Promise<MenuDto> {
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['restaurant'],
    });
    if (!menu) throw new NotFoundException(`Menu with id ${menuId} not found`);
    return new MenuDto(menu);
  }

  async processAndCreate(restaurantId: string, file: Express.Multer.File): Promise<MenuDto> {
    // 1. Compute file hash for idempotency (server-side only — never from user input)
    const fileHash = createHash('sha256').update(file.buffer).digest('hex');

    // 2. Load restaurant WITH town relation for townSlug
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: ['town'],
    });
    if (!restaurant) throw new NotFoundException(`Restaurant with id ${restaurantId} not found`);

    const townSlug = restaurant.town?.slug ?? 'unknown';

    // 3. Idempotency check BEFORE creating the processing row
    const existing = await this.menuRepository.findOne({
      where: { restaurant: { id: restaurantId }, fileHash, status: 'completed' },
      relations: ['restaurant'],
    });
    if (existing) {
      this.logger.log(`Idempotent hit for restaurant ${restaurantId} hash ${fileHash.slice(0, 8)}...`);
      return new MenuDto(existing);
    }

    // 4. Create menu record in processing state, with fileHash set
    const menu = this.menuRepository.create({
      restaurant,
      fileName: file.originalname,
      mimeType: file.mimetype,
      status: 'processing',
      fileHash,
    });
    const savedMenu = await this.menuRepository.save(menu);

    try {
      // 5. Read engine flag and dispatch
      const engine = this.configService.get('menuExtraction', { infer: true })?.engine ?? 'anthropic';

      let modelPriceRanges: PriceRange[] = [];

      if (engine === 'anthropic') {
        // Anthropic path — wrap in withRetry, NO Kmizen fallback (D-03/INTEG-03)
        const result = await this.withRetry(() =>
          this.anthropicMenuExtractionService.processMenuFile(file, { townSlug, restaurantId }),
        );

        savedMenu.data = result.data; // ExtractionResult.data is already the frozen MenuData — no extracted_data unwrap
        savedMenu.fileUrl = result.fileUrl;
        modelPriceRanges = result.priceRanges ?? [];

        // Log confidence sidecar for ops — NOT persisted into menu.data (D-06/T-07-08)
        this.logger.log(
          `Anthropic extraction done — confidence: ${result.overallConfidence}, flags: ${result.reviewFlags.length}`,
        );
      } else {
        // Kmizen path — manual-only (engine==='kmizen' by explicit env flag, never by fallback)
        const result = await this.kmizenService.processMenuFile(file);
        savedMenu.data = result.data?.extracted_data ?? result.data;
        savedMenu.fileUrl = result.fileUrl;
      }

      savedMenu.status = 'completed';
      const updatedMenu = await this.menuRepository.save(savedMenu);

      // Auto-fill restaurant.menuUrl with uploaded file URL + derive priceRanges
      if (updatedMenu.fileUrl) {
        restaurant.menuUrl = updatedMenu.fileUrl;
        // Prefer the model's consolidated buckets; fall back to deterministic per-category derive.
        const ranges =
          modelPriceRanges.length > 0 ? modelPriceRanges : derivePriceRangesFromMenu(updatedMenu.data as MenuData);
        if (ranges.length > 0) {
          ranges[0].featured = true; // default the first as the listing-card range
          restaurant.priceRanges = ranges;
          const { lowestPrice, higherPrice } = deriveLowestHighest(ranges);
          restaurant.lowestPrice = lowestPrice;
          restaurant.higherPrice = higherPrice;
        }
        await this.restaurantRepository.save(restaurant);
      }

      return new MenuDto(updatedMenu);
    } catch (error) {
      this.logger.error(`Failed to process menu for restaurant ${restaurantId}: ${(error as Error).message}`);
      savedMenu.status = 'failed';
      await this.menuRepository.save(savedMenu);
      throw error;
    }
  }

  async delete(menuId: string): Promise<void> {
    const menu = await this.menuRepository.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException(`Menu with id ${menuId} not found`);
    await this.menuRepository.remove(menu);
  }
}
