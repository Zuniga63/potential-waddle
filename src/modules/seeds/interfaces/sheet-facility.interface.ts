interface SheetFacilityBase {
  name: string;
  slug: string;
  models?: string;
}

export interface SheetFacilityData extends SheetFacilityBase {
  checked: boolean;
}

export interface SheetFacility extends SheetFacilityBase {
  id: string;
  name: string;
  slug: string;
  models?: string;
}
