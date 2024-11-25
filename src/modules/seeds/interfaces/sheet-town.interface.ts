interface SheetTownBase {
  name: string;
  description?: string;
  departmentNumber?: number;
  enabled?: boolean;
  longitude?: string;
  latitude?: string;
  urbanArea?: number;
}

export interface SheetTownData extends SheetTownBase {
  checked: boolean;
}

export interface SheetTown extends SheetTownBase {
  id: string;
}
