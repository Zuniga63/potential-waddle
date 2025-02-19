interface SheetPlaceBase {
  order: number;
  name: string;
  slug: string;
  imageCount?: number;
  zone?: string;
  description: string;
  longitude: string;
  latitude: string;
  googleMapsLink?: string;
  driveFolderLink?: string;
  cloudinaryFolder: string;
  difficulty: number;
  facilities?: string;
  points: number;
  distance?: number;
  altitude?: number;
  howToGetThere?: string;
  town: string;
  category?: string;
  arrivalReference?: string;
  transportReference?: string;
  maxDeep?: number;
  capacity?: number;
  minAge?: number;
  maxAge?: number;
  recomendations?: string;
  howToDress?: string;
  internalRecommendations?: string;
  temperature?: string;
  popularity: number;
}

export interface SheetPlaceData extends SheetPlaceBase {
  checked: boolean;
}

export interface SheetPlace extends SheetPlaceBase {
  id: string;
}
