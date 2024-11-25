interface SheetRestaurantBase {
  town: string;
  categories?: string;
  facilities?: string;
  name: string;
  slug: string;
  description: string;
  points: number;
  spokenLanguages?: string;
  address?: string;
  phoneNumbers?: string;
  whatsappNumbers?: string;
  openingHours?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  lowestPrice?: number;
  highestPrice?: number;
  longitude: number;
  latitude: number;
  urbanCenterDistance: number;
  googleMapsUrl?: string;
  howToGetThere?: string;
  townZone?: string;
}

export interface SheetRestaurantData extends SheetRestaurantBase {
  checked: boolean;
}

export interface SheetRestaurant extends SheetRestaurantBase {
  id: string;
}
