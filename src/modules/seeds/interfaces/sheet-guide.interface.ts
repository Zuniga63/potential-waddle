export interface SheetGuideBase {
  slug: string;
  firstName: string;
  lastName: string;
  town: string;
  address: string;
  categories: string;
  email: string;
  documentType: string;
  document: string;
  phone: string;
  whatsapp?: string;
  biography?: string;
  languages?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  isAvailable: boolean;
}

export interface SheetGuideData extends SheetGuideBase {
  checked: boolean;
}

export interface SheetGuide extends SheetGuideBase {
  id: string;
}
