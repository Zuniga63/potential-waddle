interface SheetModelBase {
  name: string;
  slug: string;
}

export interface SheetModelData extends SheetModelBase {
  checked: boolean;
}

export interface SheetModel extends SheetModelBase {
  id: string;
}
