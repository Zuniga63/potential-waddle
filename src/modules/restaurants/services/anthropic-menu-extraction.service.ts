import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { EnvironmentVariables } from 'src/config/app-config';
import { GcpStorageService } from 'src/modules/documents/services/gcp-storage.service';
import { MenuExtractionOutputSchema, MenuExtractionOutput, MenuCategoryInput } from '../schemas/menu-data.schema';
import { MENU_EXTRACTION_SCHEMA } from '../schemas/menu-extraction-schema.const';
import { ExtractionResult, MenuData, MenuCategory, MenuProduct } from '../interfaces/menu-extraction-result.interface';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
const MAX_FILE_BYTES = 70 * 1024 * 1024; // 70 MB — menus (esp. PDFs) can be large

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
6. NESTING: When the menu visually groups items under a parent heading that itself contains several sub-headings (e.g. a large "Bebidas" heading containing "Cócteles", "Sangría", "Vinos"), represent the parent as a category and each sub-heading as an entry in that category's "subcategories" (same shape, recursively). Put the items under the sub-heading they belong to. For flat sections with no sub-headings, just use "products" and omit "subcategories". Do NOT invent grouping that is not visually present.
7. PRICE SUMMARY (price_ranges): SEPARATELY from the full menu, also produce a SHORT list (about 3–6) of consolidated price buckets the restaurant would advertise on its profile — think like a person, not like the menu's section headers. GROUP related sections into broad, meaningful categories: hamburgers, meats, fish/seafood, pastas, grilled and main dishes all belong to "Platos fuertes"; sodas, juices, beer, cocktails, coffee, lemonades belong to "Bebidas"; appetizers/sharing plates to "Entradas"; sweets to "Postres". Do NOT emit one bucket per menu section and do NOT create redundant or overlapping buckets ("Burgers desde", "Mariscos desde", "Carnes desde" are WRONG — they are all "Platos fuertes"). Use natural Spanish labels. price_from = the lowest integer-COP price among the items you grouped into that bucket. Only include buckets that have priced items.

Use the extract_menu tool to return the result.`;

@Injectable()
export class AnthropicMenuExtractionService {
  private readonly logger = new Logger(AnthropicMenuExtractionService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly gcpStorageService: GcpStorageService,
  ) {
    const config = this.configService.get('anthropic', { infer: true });
    this.anthropic = new Anthropic({ apiKey: config?.apiKey || '' });
    // Model + token budget are decoupled from Rafa — use the dedicated menuExtraction config.
    const menuExtraction = this.configService.get('menuExtraction', { infer: true });
    this.model = menuExtraction?.model || 'claude-haiku-4-5';
    this.maxTokens = menuExtraction?.maxTokens || 16384;
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
      throw new BadRequestException('File exceeds 70MB limit');
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

    // 5. Build the content block based on MIME type (URL source → no 32MB request cap)
    const sourceBlock = this.buildSourceBlock(file, publicUrl);

    // 6. Call Anthropic with forced tool-use
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
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
   *
   * Uses a URL source (the already-uploaded GCS public URL) instead of inline
   * base64. Anthropic fetches the file server-side, so the file bytes never
   * travel in the request payload — this bypasses the 32MB per-request size
   * limit that base64 inline hits, letting heavy menus (large PDFs/photos)
   * extract correctly. The only remaining limit is pages (600 for large-context
   * models), which menus never approach.
   */
  private buildSourceBlock(
    file: Express.Multer.File,
    fileUrl: string,
  ): Anthropic.Messages.ImageBlockParam | Anthropic.Messages.DocumentBlockParam {
    if (file.mimetype === 'application/pdf') {
      return {
        type: 'document',
        source: {
          type: 'url',
          url: fileUrl,
        },
      };
    }

    return {
      type: 'image',
      source: {
        type: 'url',
        url: fileUrl,
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

    const walk = (categories: MenuCategoryInput[]): void => {
      for (const category of categories) {
        for (const product of category.products ?? []) {
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
        if (category.subcategories?.length) {
          walk(category.subcategories);
        }
      }
    };

    walk(output.categories);
    return flags;
  }

  /**
   * Map Zod-validated output to ExtractionResult.
   * Strips item_confidence and overall_confidence from the FROZEN MenuData shape.
   * Confidence fields live only in sidecar fields (overallConfidence, reviewFlags).
   */
  private toExtractionResult(output: MenuExtractionOutput, fileUrl: string): ExtractionResult {
    // Recursively map categories → MenuData, DROPPING item_confidence at every level
    // (incl. nested subcategories). Confidence never appears inside menu.data.
    const stripCategory = (cat: MenuCategoryInput): MenuCategory => ({
      category_name: cat.category_name,
      products: (cat.products ?? []).map(
        (p): MenuProduct => ({
          product_name: p.product_name,
          product_price: p.product_price,
          product_description: p.product_description ?? null,
        }),
      ),
      ...(cat.subcategories?.length ? { subcategories: cat.subcategories.map(stripCategory) } : {}),
    });

    const categories: MenuCategory[] = output.categories.map(stripCategory);

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
      priceRanges: (output.price_ranges ?? []).map(r => ({ label: r.label, priceFrom: r.price_from })),
    };
  }
}
