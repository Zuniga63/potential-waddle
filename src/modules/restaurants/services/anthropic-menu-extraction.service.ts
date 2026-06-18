import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { EnvironmentVariables } from 'src/config/app-config';
import { GcpStorageService } from 'src/modules/documents/services/gcp-storage.service';
import { MenuExtractionOutputSchema, MenuExtractionOutput } from '../schemas/menu-data.schema';
import { MENU_EXTRACTION_SCHEMA } from '../schemas/menu-extraction-schema.const';
import { ExtractionResult, MenuData, MenuCategory, MenuProduct } from '../interfaces/menu-extraction-result.interface';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — vision base64 limit / cost guard
const MAX_TOKENS = 4096;

/**
 * Extraction prompt placed in the user message alongside the image/document block.
 * Five clauses per RESEARCH §"System Prompt Engineering":
 *   1. Anti-hallucination — only extract what is explicitly visible.
 *   2. COP price format — integer, no separators, '.' and ',' are thousands separators.
 *   3. Completeness — all categories, columns, sections and pages.
 *   4. Confidence — item_confidence per item, overall_confidence for the menu.
 *   5. Layout — multi-column / multi-page / section headers → category_name.
 */
const EXTRACTION_PROMPT = `Extract the structured menu from the provided restaurant menu image or PDF.

Rules:
1. ANTI-HALLUCINATION: Only extract information explicitly visible in the menu. If a field is not visible, return null — do NOT infer or invent any data.
2. COP PRICES: Prices are in Colombian Pesos (COP). Output the price as a plain integer with NO separators (e.g. $25.000 → 25000, $1.500.000 → 1500000). In COP, the period '.' and comma ',' are ALWAYS thousands separators, never decimal points — $25.000 means twenty-five thousand pesos (25000), not twenty-five. If no price is shown for an item, output null.
3. COMPLETENESS: Extract ALL categories and ALL items. Do not omit any section, column, page, or product — even if the text is small or partially visible.
4. CONFIDENCE: For each item provide item_confidence (0–100) reflecting how clearly you read the item name and price. Use lower values for blurry, angled, handwritten, or ambiguous text. Also provide overall_confidence for the entire extraction.
5. LAYOUT: The menu may have multiple columns, sections with headers, or multiple pages. Treat each section header as a category_name. Each distinct section becomes its own category entry.

Use the extract_menu tool to return the result.`;

@Injectable()
export class AnthropicMenuExtractionService {
  private readonly logger = new Logger(AnthropicMenuExtractionService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly gcpStorageService: GcpStorageService,
  ) {
    const config = this.configService.get('anthropic', { infer: true });
    this.anthropic = new Anthropic({ apiKey: config?.apiKey || '' });
    this.model = config?.model || 'claude-haiku-4-5';
  }

  /**
   * Process a menu file (image or PDF) using Claude forced tool-use.
   * Validates MIME type and size, uploads to GCS, calls Anthropic,
   * checks stop_reason, validates output with Zod, and returns
   * an ExtractionResult with confidence fields stripped from MenuData.
   *
   * @param file - Multer file (buffer, originalname, mimetype, size)
   * @param context - townSlug and restaurantId for GCS path construction
   * @returns ExtractionResult with FROZEN MenuData shape + sidecar confidence fields
   */
  async processMenuFile(
    file: Express.Multer.File,
    context: { townSlug: string; restaurantId: string },
  ): Promise<ExtractionResult> {
    // 1. Guard MIME
    if (!ALLOWED_MIME.includes(file.mimetype as (typeof ALLOWED_MIME)[number])) {
      throw new BadRequestException(`Unsupported mime type: ${file.mimetype}`);
    }

    // 2. Guard size
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('File exceeds 10MB limit');
    }

    // 3. Log metadata ONLY — never log file.buffer or any base64 content (SEC-03)
    this.logger.log(`Extracting menu: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

    // 4. Upload to GCS for fileUrl
    const { publicUrl } = await this.gcpStorageService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      townSlug: context.townSlug,
      entityType: 'restaurants',
      entityId: context.restaurantId,
      folder: 'menus',
    });

    // 5. Build the content block based on MIME type
    const sourceBlock = this.buildSourceBlock(file);

    // 6. Call Anthropic with forced tool-use
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: MAX_TOKENS,
      tool_choice: { type: 'tool', name: 'extract_menu' },
      tools: [
        {
          name: 'extract_menu',
          description:
            'Extract the structured menu (categories, products, COP prices) from the provided restaurant menu image or PDF.',
          input_schema: MENU_EXTRACTION_SCHEMA as Anthropic.Messages.Tool['input_schema'],
        },
      ],
      messages: [
        {
          role: 'user',
          content: [sourceBlock, { type: 'text', text: EXTRACTION_PROMPT }],
        },
      ],
    });

    // 7. Truncation guard FIRST (EXTRACT-08 / D-09): max_tokens means incomplete output — never accept
    if (response.stop_reason === 'max_tokens') {
      throw new Error('Menu extraction truncated (max_tokens) — marking failed');
    }

    // 8. Find the tool_use block in the response
    const toolUse = response.content.find(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
    );
    if (!toolUse) {
      throw new Error('No tool_use block in extraction response');
    }

    // 9. Zod validate the tool output (toolUse.input is typed as unknown)
    const parsed = MenuExtractionOutputSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new Error(`Zod validation failed: ${parsed.error.message}`);
    }

    // 10. Build sidecar + strip confidence fields, return ExtractionResult
    return this.toExtractionResult(parsed.data, publicUrl);
  }

  /**
   * Build the Anthropic content block for the file.
   * PDF → document block (native multi-page support).
   * Image (JPEG/PNG/WebP) → image block.
   */
  private buildSourceBlock(
    file: Express.Multer.File,
  ): Anthropic.Messages.ImageBlockParam | Anthropic.Messages.DocumentBlockParam {
    if (file.mimetype === 'application/pdf') {
      return {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: file.buffer.toString('base64'),
        },
      };
    }

    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp',
        data: file.buffer.toString('base64'),
      },
    };
  }

  /**
   * Build human-readable review flags from the validated extraction output.
   * Flags low-confidence items, null-price items, and suspiciously low prices
   * (which often indicate a COP thousands-separator parsing error by the model).
   */
  private buildReviewFlags(output: MenuExtractionOutput): string[] {
    const flags: string[] = [];

    for (const category of output.categories) {
      for (const product of category.products) {
        if (product.item_confidence < 70) {
          flags.push(`Low confidence on item: ${product.product_name}`);
        }
        if (product.product_price === null) {
          flags.push(`No price found for: ${product.product_name}`);
        }
        if (product.product_price !== null && product.product_price < 500) {
          flags.push(
            `Suspicious price (possible separator error): ${product.product_name} = ${product.product_price}`,
          );
        }
      }
    }

    return flags;
  }

  /**
   * Map Zod-validated output to ExtractionResult.
   * Strips item_confidence and overall_confidence from the FROZEN MenuData shape.
   * Confidence fields live only in sidecar fields (overallConfidence, reviewFlags).
   */
  private toExtractionResult(output: MenuExtractionOutput, fileUrl: string): ExtractionResult {
    const categories: MenuCategory[] = output.categories.map((cat) => ({
      category_name: cat.category_name,
      products: cat.products.map(
        (p): MenuProduct => ({
          product_name: p.product_name,
          product_price: p.product_price,
          product_description: p.product_description ?? null,
          // item_confidence is intentionally DROPPED here — never in MenuData
        }),
      ),
    }));

    const data: MenuData = {
      restaurant_name: output.restaurant_name ?? null,
      currency: output.currency ?? null,
      notes: output.notes ?? null,
      categories,
    };

    return {
      data,
      fileUrl,
      overallConfidence: output.overall_confidence,
      reviewFlags: this.buildReviewFlags(output),
    };
  }
}
