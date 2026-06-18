import { z } from 'zod';

/**
 * Zod schema for a single menu product as extracted by the Anthropic model.
 * Mirrors the FROZEN frontend MenuProduct interface but uses integer|null for price
 * (COP has no cents) and adds item_confidence for the sidecar.
 *
 * NOTE: item_confidence is required in the model output and lives here in the
 * validation schema. It must be STRIPPED before writing to menu.data (MenuData).
 */
export const MenuProductSchema = z.object({
  product_name: z.string(),
  product_price: z.number().int().nullable(),
  product_description: z.string().nullable().optional(),
  item_confidence: z.number().int().min(0).max(100),
});

/**
 * Zod schema for a menu category, containing a list of products.
 * Mirrors the FROZEN frontend MenuCategory interface.
 */
export const MenuCategorySchema = z.object({
  category_name: z.string(),
  products: z.array(MenuProductSchema),
});

/**
 * Zod schema for the full menu extraction output from the Anthropic tool.
 * Mirrors the FROZEN frontend MenuData interface but adds overall_confidence
 * for the sidecar. overall_confidence must NOT be written to menu.data.
 *
 * This schema validates the raw tool_use.input from the Anthropic response
 * before the extraction service accepts the result.
 */
export const MenuExtractionOutputSchema = z.object({
  restaurant_name: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  categories: z.array(MenuCategorySchema),
  overall_confidence: z.number().int().min(0).max(100),
});

export type MenuExtractionOutput = z.infer<typeof MenuExtractionOutputSchema>;
