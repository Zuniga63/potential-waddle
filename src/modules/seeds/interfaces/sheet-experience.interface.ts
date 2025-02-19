interface SheetExperienceBase {
  town: string;
  categories: string;
  facilities: string;
  title: string;
  slug: string;
  description: string;
  difficultyLevel: string;
  price: number;
  departureDescription: string;
  departureLongitude: number;
  departureLatitude: number;
  arrivalDescription: string;
  arrivalLongitude: number;
  arrivalLatitude: number;
  totalDistance: number;
  travelTime: number;
  points: number;
  minAge?: number;
  maxAge?: number;
  minParticipants?: number;
  maxParticipants?: number;
  recommendations?: string;
  howToDress?: string;
  restrictions?: string;
  guides?: string;
}

export interface SheetExperienceData extends SheetExperienceBase {
  checked: boolean;
}

export interface SheetExperience extends SheetExperienceBase {
  id: string;
}
