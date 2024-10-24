import type { SortOrder } from '../types';

export interface FilterSortBy<T = string> {
  property: T;
  order: SortOrder;
}
