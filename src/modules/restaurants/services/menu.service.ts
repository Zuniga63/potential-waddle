import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from '../entities/menu.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { KmizenService } from './kmizen.service';
import { MenuDto } from '../dto/menu.dto';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    private readonly kmizenService: KmizenService,
  ) {}

  async findAllByRestaurant(restaurantId: string): Promise<MenuDto[]> {
    const menus = await this.menuRepository.find({
      where: { restaurant: { id: restaurantId } },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
    return menus.map(menu => new MenuDto(menu));
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
    const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException(`Restaurant with id ${restaurantId} not found`);

    // Create menu record in processing state
    const menu = this.menuRepository.create({
      restaurant,
      fileName: file.originalname,
      mimeType: file.mimetype,
      status: 'processing',
    });
    const savedMenu = await this.menuRepository.save(menu);

    try {
      const result = await this.kmizenService.processMenuFile(file);

      savedMenu.data = result.data?.extracted_data ?? result.data;
      savedMenu.fileUrl = result.fileUrl;
      savedMenu.status = 'completed';
      const updatedMenu = await this.menuRepository.save(savedMenu);

      return new MenuDto(updatedMenu);
    } catch (error) {
      this.logger.error(`Failed to process menu for restaurant ${restaurantId}: ${error.message}`);
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
