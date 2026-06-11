import type { Restaurant } from '../entities';
import { TownDto } from 'src/modules/towns/dto';
import { PlaceDto } from 'src/modules/places/dto';
import { CategoryDto, FacilityDto } from 'src/modules/core/dto';
import { ApiProperty } from '@nestjs/swagger';
import type { RestaurantTermsStatusState, RestaurantDocsStatusState } from '../utils/compute-restaurant-completion';

// Owner-scoped sub-DTOs surfacing the 3-indicator completion model (mirror of LodgingFullDto).

export class RestaurantTermsStatusDto {
  @ApiProperty({ enum: ['no_aplica', 'aceptados', 'pendientes'] })
  state: RestaurantTermsStatusState;

  @ApiProperty({ type: String, nullable: true, required: false })
  activeTermsId?: string | null;
}

export class RestaurantDocsStatusDto {
  @ApiProperty({ enum: ['no_requeridos', 'opcionales', 'incompletos', 'completos'] })
  state: RestaurantDocsStatusState;

  @ApiProperty({ example: 2 })
  uploaded: number;

  @ApiProperty({ example: 3 })
  required: number;

  @ApiProperty({ type: [String] })
  missing: string[];
}

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

  showBinntuReviews?: boolean;

  hasPromotions?: boolean;

  latestPromotionValue?: number;

  activePromotions?: any[];

  userReview?: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * OWNER-SCOPED FIELDS (only populated when the requester is the owner — see applyOwnerEnrichment)
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({ required: false, enum: ['draft', 'pending_review', 'published', 'rejected'] })
  status?: 'draft' | 'pending_review' | 'published' | 'rejected';

  @ApiProperty({ required: false, type: Number })
  completionPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  missingFields?: string[];

  @ApiProperty({ required: false, type: Date, nullable: true })
  submittedAt?: Date | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  rejectionReason?: string | null;

  @ApiProperty({ required: false, type: Boolean })
  menuNotApplicable?: boolean;

  @ApiProperty({ required: false, type: Number })
  infoPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  infoMissingFields?: string[];

  @ApiProperty({ required: false, type: Boolean })
  infoCriticalSatisfied?: boolean;

  @ApiProperty({ required: false, type: RestaurantTermsStatusDto })
  termsStatus?: RestaurantTermsStatusDto;

  @ApiProperty({ required: false, type: RestaurantDocsStatusDto })
  docsStatus?: RestaurantDocsStatusDto;

  @ApiProperty({ required: false, type: Boolean })
  readyToSubmit?: boolean;

  @ApiProperty({ required: false, type: [String] })
  skippedOptionalFields?: string[];

  constructor({ data, userReview }: { data?: Restaurant | null; userReview?: string }) {
    if (!data) return;

    this.id = data.id;
    this.userReview = userReview;
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
    this.showBinntuReviews = data.showBinntuReviews ?? undefined;
    this.menuNotApplicable = data.menuNotApplicable ?? false;
    this.skippedOptionalFields = data.skippedOptionalFields ?? [];
    // status / completionPercentage / 3-indicator fields are populated by the
    // service via applyOwnerEnrichment when the caller is the owner.
  }
}
