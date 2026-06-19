export interface PriceRange {
  label: string;
  priceFrom: number;
  /** When true, this is the single range shown on the listing card. Only one entry should be featured. */
  featured?: boolean;
}
