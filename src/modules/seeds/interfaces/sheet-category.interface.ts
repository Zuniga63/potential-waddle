interface SheetCategoryBase {
  name: string;
  slug: string;
  iconName?: string;
  models?: string;
}

export interface SheetCategoryData extends SheetCategoryBase {
  checked: boolean;
}

export interface SheetCategory extends SheetCategoryBase {
  id: string;
}
