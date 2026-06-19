import type { MenuData, MenuCategory } from '../interfaces/menu-extraction-result.interface';
import type { PriceRange } from '../interfaces/price-range.interface';

/**
 * Recursively finds the minimum non-null product_price across a category
 * and all its nested subcategories.
 */
function minPriceInCategory(category: MenuCategory): number | null {
  const prices: number[] = [];

  for (const product of category.products ?? []) {
    if (product.product_price !== null && product.product_price !== undefined) {
      prices.push(product.product_price);
    }
  }

  for (const sub of category.subcategories ?? []) {
    const subMin = minPriceInCategory(sub);
    if (subMin !== null) prices.push(subMin);
  }

  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * Derives PriceRange entries deterministically from extracted MenuData.
 * One entry per top-level category that has at least one priced item.
 */
export function derivePriceRangesFromMenu(data: MenuData): PriceRange[] {
  const ranges: PriceRange[] = [];

  for (const category of data.categories ?? []) {
    const min = minPriceInCategory(category);
    if (min !== null) {
      ranges.push({ label: category.category_name, priceFrom: min });
    }
  }

  // Default the first range as the one featured on the listing card.
  if (ranges.length > 0) ranges[0].featured = true;

  return ranges;
}

/**
 * Derives lowestPrice and higherPrice from an array of PriceRange entries.
 * Returns nulls when the array is empty.
 */
export function deriveLowestHighest(ranges: PriceRange[]): { lowestPrice: number | null; higherPrice: number | null } {
  if (ranges.length === 0) return { lowestPrice: null, higherPrice: null };
  const prices = ranges.map(r => r.priceFrom);
  return {
    lowestPrice: Math.min(...prices),
    higherPrice: Math.max(...prices),
  };
}
