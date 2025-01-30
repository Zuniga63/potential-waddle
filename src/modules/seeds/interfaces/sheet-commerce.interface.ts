interface SheetCommerceBase {
  town: string;
  categories: string;
  facilities: string;
  name: string;
  slug: string;
  description: string;
  points: number;
  languages: string;
  address: string;
  phones: string;
  whatsapps: string;
  openingHours: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  longitude: number;
  latitude: number;
  driveFolder: string;
  distance: number;
  googleMaps: string;
  howToGetThere: string;
  zone: string;
  airbnb: string;
}

export interface SheetCommerceData extends SheetCommerceBase {
  checked: boolean;
}

export interface SheetCommerce extends SheetCommerceBase {
  id: string;
}
