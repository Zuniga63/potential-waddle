interface SheetDepartmentBase {
  name: string;
  capital: string;
  number: number;
}

export interface SheetDepartmentData extends SheetDepartmentBase {
  checked: boolean;
}

export interface SheetDepartment extends SheetDepartmentBase {
  id: string;
}
