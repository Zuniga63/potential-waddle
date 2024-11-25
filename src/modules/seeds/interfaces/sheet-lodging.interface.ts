interface SheetLodgingBase {
  name: string;
  slug: string;
  town: string;
  address?: string;
  categories?: string;
  facilities?: string;
  phones?: string;
  email?: string;
  website?: string;
  description?: string;
  openingHours?: string;
  availability?: string;
  howToGetThere?: string;
  zone?: string;
  distance?: number;
  maxCapacity?: string;
  roomTypes?: string;
  roomCount: string;
  lowestPrice?: string;
  highestPrice?: string;
  conveniences?: string;
  commonAreas?: string;
  driveFolder?: string;
  languages?: string;
  longitude: string;
  latitude: string;
  googleMaps?: string;
  whatsapps?: string;
  facebook?: string;
  airbnb?: string;
  instagram?: string;
  amenities?: string;
}

export interface SheetLodgingData extends SheetLodgingBase {
  checked: boolean;
}

export interface SheetLodging extends SheetLodgingBase {
  id: string;
}
