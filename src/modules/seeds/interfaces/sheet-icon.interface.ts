interface SheetIconBase {
  name: string;
  code: string;
}

export interface SheetIconData extends SheetIconBase {
  checked: boolean;
}

export interface SheetIcon extends SheetIconBase {
  id: string;
}
