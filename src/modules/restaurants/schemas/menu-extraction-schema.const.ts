/**
 * Hand-written JSON Schema for the Anthropic tool `input_schema`.
 *
 * Anthropic's SDK does NOT accept Zod schemas as input_schema — this must be
 * a plain JSON Schema object. It mirrors MenuExtractionOutputSchema (Zod)
 * including sidecar confidence fields (item_confidence, overall_confidence)
 * that the model populates and the service must strip before persisting to menu.data.
 *
 * Categories are RECURSIVE via `$defs`/`$ref`: a category may contain products
 * AND/OR nested `subcategories` of the same shape (e.g. "Bebidas" → "Cócteles"
 * / "Vinos" → products). Flat menus simply leave `subcategories` out.
 *
 * Source: platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
 */
export const MENU_EXTRACTION_SCHEMA = {
  type: 'object',
  $defs: {
    category: {
      type: 'object',
      properties: {
        category_name: {
          type: 'string',
          description: 'Section or category header (e.g. "Entradas", "Bebidas", "Cócteles")',
        },
        products: {
          type: 'array',
          description: 'Products directly in this category. Omit or leave empty if this category only holds subcategories.',
          items: {
            type: 'object',
            properties: {
              product_name: {
                type: 'string',
                description: 'Exact product name as shown on the menu',
              },
              product_price: {
                type: ['integer', 'null'],
                description:
                  'Price as integer COP with no separators (e.g. $25.000 → 25000, $1.500.000 → 1500000). Null if no price is shown.',
              },
              product_description: {
                type: ['string', 'null'],
                description: 'Short product description if visible on the menu, null if none',
              },
              item_confidence: {
                type: 'integer',
                minimum: 0,
                maximum: 100,
                description:
                  'Your confidence 0–100 that this item (name and price) was read correctly. Use lower values for blurry, angled, or ambiguous text.',
              },
            },
            required: ['product_name', 'product_price', 'item_confidence'],
          },
        },
        subcategories: {
          type: 'array',
          description:
            'Nested sub-sections under this category. Use ONLY when the menu visually groups items under a parent heading with sub-headings (e.g. "Bebidas" containing "Cócteles", "Vinos"). Each subcategory has the same shape. Leave empty/omit for flat sections.',
          items: { $ref: '#/$defs/category' },
        },
      },
      required: ['category_name'],
    },
  },
  properties: {
    restaurant_name: {
      type: ['string', 'null'],
      description: 'Restaurant name if visible on the menu, null if not shown',
    },
    currency: {
      type: ['string', 'null'],
      description: 'Currency code (e.g. COP), null if not stated on the menu',
    },
    notes: {
      type: ['string', 'null'],
      description: 'Any additional menu notes or disclaimers, null if none',
    },
    categories: {
      type: 'array',
      description: 'All top-level menu categories. Do not omit any section.',
      items: { $ref: '#/$defs/category' },
    },
    overall_confidence: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Overall extraction confidence 0–100 for the entire menu.',
    },
    price_ranges: {
      type: 'array',
      description:
        'A SHORT list (about 3–6) of consolidated, human-style price buckets the restaurant would advertise — NOT one per menu section. Group related sections into broad categories a person would naturally use: hamburgers, meats, fish/seafood, pastas, grilled and main dishes → "Platos fuertes"; sodas, juices, beer, cocktails, coffee, lemonades → "Bebidas"; appetizers/sharing plates → "Entradas"; sweets → "Postres"; etc. Do NOT create redundant or overlapping buckets. Use natural Spanish labels. price_from is the lowest integer-COP price among the items grouped into that bucket. Only include buckets that have at least one priced item.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Natural bucket name in Spanish (e.g. "Platos fuertes", "Bebidas")' },
          price_from: { type: 'integer', description: 'Lowest integer-COP price among items grouped into this bucket' },
        },
        required: ['label', 'price_from'],
      },
    },
  },
  required: ['categories', 'overall_confidence'],
} as const;
