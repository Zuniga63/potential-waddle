import type { Restaurant } from '../entities';
import { TownDto } from 'src/modules/towns/dto';
import { PlaceDto } from 'src/modules/places/dto';
import { CategoryDto, FacilityDto } from 'src/modules/core/dto';

export class RestaurantDto {
  id: string;

  name: string;

  slug: string;

  description?: string;

  rating: number;

  reviewCount: number;

  points: number;

  spokenLanguages: string[];

  address?: string;

  phoneNumbers?: string[];

  whatsappNumbers: string[];

  openingHours: string[];

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

  town?: TownDto;

  images: string[];

  place?: PlaceDto;

  categories?: CategoryDto[];

  facilities?: FacilityDto[];

  isPublic: boolean;

  userId?: string;

  paymentMethods?: string[];

  googleMapsRating?: number;

  googleMapsReviewsCount?: number;

  showGoogleMapsReviews?: boolean;

  constructor({ data }: { data?: Restaurant | null }) {
    if (!data) return;

    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description ?? undefined;
    this.rating = data.rating;
    this.reviewCount = data.reviewCount;
    this.points = data.points;
    this.spokenLanguages = data.spokenLanguages ?? [];
    this.address = data.address ?? undefined;
    this.phoneNumbers = data.phoneNumbers ?? [];
    this.whatsappNumbers = data.whatsappNumbers ?? [];
    this.openingHours = data.openingHours ?? [];
    this.email = data.email ?? undefined;
    this.website = data.website ?? undefined;
    this.instagram = data.instagram ?? undefined;
    this.facebook = data.facebook ?? undefined;
    this.lowestPrice = data.lowestPrice ?? undefined;
    this.highestPrice = data.higherPrice ?? undefined;
    this.longitude = data.location.coordinates[0] ?? 0;
    this.latitude = data.location.coordinates[1] ?? 0;
    this.images = data.images?.map(i => i.imageResource.url) || [];
    this.urbanCenterDistance = data.urbanCenterDistance ?? 0;
    this.googleMapsUrl = data.googleMapsUrl ?? undefined;
    this.howToGetThere = data.howToGetThere ?? undefined;
    this.townZone = data.townZone ?? undefined;
    this.town = data.town ? new TownDto(data.town) : undefined;
    this.place = data.place ? new PlaceDto(data.place) : undefined;
    this.categories = data.categories ? data.categories.map(c => new CategoryDto(c)) : [];
    this.facilities = data.facilities ? data.facilities.map(f => new FacilityDto(f)) : [];
    this.isPublic = data.isPublic;
    this.userId = data.user?.id ?? undefined;
    this.paymentMethods = data.paymentMethods ?? [];
    this.googleMapsRating = data.googleMapsRating ?? undefined;
    this.googleMapsReviewsCount = data.googleMapsReviewsCount ?? undefined;
    this.showGoogleMapsReviews = data.showGoogleMapsReviews ?? undefined;
  }
}
