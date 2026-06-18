// MenuData mirrors the FROZEN frontend interface (binntu/src/modules/restaurants/interfaces/menu.interface.ts).
// Confidence/review data lives in ExtractionResult sidecar fields, NEVER inside MenuData.
//
// The backend cannot import from the frontend repo, so MenuData and its sub-types
// are re-declared here. product_price is normalized to number | null (integers only in COP)
// rather than the frontend's number | string, which accommodates display strings.

export interface MenuProduct {
  product_name: string;
  product_price: number | null;
  product_description?: string | null;
}

export interface MenuCategory {
  category_name: string;
  products: MenuProduct[];
}

export interface MenuData {
  restaurant_name?: string | null;
  currency?: string | null;
  notes?: string | null;
  categories: MenuCategory[];
}

/**
 * Sidecar contract returned by AnthropicMenuExtractionService.processMenuFile().
 *
 * The `data` field contains the FROZEN MenuData shape — confidence fields stripped out.
 * `overallConfidence` and `reviewFlags` are sidecar-only and must never be written
 * into the `menu.data` column (which expects the FROZEN MenuData shape).
 */
export interface ExtractionResult {
  data: MenuData; // FROZEN shape — confidence fields stripped out
  fileUrl: string; // from GcpStorageService publicUrl
  overallConfidence: number; // 0–100
  reviewFlags: string[]; // human-readable low-confidence flags
}
