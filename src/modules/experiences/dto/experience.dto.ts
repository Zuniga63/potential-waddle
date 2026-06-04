import { AppIconDto, CategoryDto, FacilityDto } from 'src/modules/core/dto';
import { Experience } from '../entities';
import { TownDto } from 'src/modules/towns/dto';
import { ExperienceGuide } from '../interfaces';
import { GuideDto } from 'src/modules/guides/dto/guide.dto';
import { ApiProperty } from '@nestjs/swagger';
import type {
  ExperienceTermsStatusState,
  ExperienceDocsStatusState,
} from '../utils/compute-experience-completion';

// Owner-scoped sub-DTOs surfacing the 3-indicator completion model (mirror of RestaurantDto).

export class ExperienceTermsStatusDto {
  @ApiProperty({ enum: ['no_aplica', 'aceptados', 'pendientes'] })
  state: ExperienceTermsStatusState;

  @ApiProperty({ type: String, nullable: true, required: false })
  activeTermsId?: string | null;
}

export class ExperienceDocsStatusDto {
  @ApiProperty({ enum: ['no_requeridos', 'opcionales', 'incompletos', 'completos'] })
  state: ExperienceDocsStatusState;

  @ApiProperty({ example: 2 })
  uploaded: number;

  @ApiProperty({ example: 3 })
  required: number;

  @ApiProperty({ type: [String] })
  missing: string[];
}

export class ExperienceDto {
  id: string;

  title: string;

  slug: string;

  description: string;

  difficultyLevel: string;

  price: number;

  priceLabel: string;

  additionalPrices: { price: number; label: string }[];

  departure: {
    description?: string;
    longitude: number;
    latitude: number;
  };

  arrival: {
    description?: string;
    longitude: number;
    latitude: number;
  };

  travelTime: number;

  totalDistance: number;

  rating: number;

  points: number;

  reviews: number;

  minAge?: number;

  maxAge?: number;

  minParticipants?: number;

  maxParticipants?: number;

  recommendations?: string;

  howToDress?: string;

  restrictions?: string;

  categories?: CategoryDto[];

  facilities?: FacilityDto[];

  images?: string[];

  town?: TownDto;

  icon?: AppIconDto;

  guides: ExperienceGuide[];

  guide?: GuideDto;

  paymentMethods?: string[];

  isPublic: boolean;

  showBinntuReviews?: boolean;

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

  @ApiProperty({ required: false, type: Number })
  infoPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  infoMissingFields?: string[];

  @ApiProperty({ required: false, type: Boolean })
  infoCriticalSatisfied?: boolean;

  @ApiProperty({ required: false, type: ExperienceTermsStatusDto })
  termsStatus?: ExperienceTermsStatusDto;

  @ApiProperty({ required: false, type: ExperienceDocsStatusDto })
  docsStatus?: ExperienceDocsStatusDto;

  @ApiProperty({ required: false, type: Boolean })
  readyToSubmit?: boolean;

  @ApiProperty({ required: false, type: [String] })
  skippedOptionalFields?: string[];

  constructor({ data, userReview }: { data: Experience; userReview?: string }) {
    if (!data) return;

    this.id = data.id;
    this.title = data.title;
    this.slug = data.slug;
    this.description = data.description;
    this.difficultyLevel = data.difficultyLevel;
    this.price = data.price;
    this.priceLabel = data.priceLabel || 'Persona';
    this.additionalPrices = data.additionalPrices || [];
    this.departure = {
      description: data.departureDescription || undefined,
      longitude: data.departureLocation?.coordinates[0],
      latitude: data.departureLocation?.coordinates[1],
    };
    this.arrival = {
      description: data.arrivalDescription || undefined,
      longitude: data.arrivalLocation?.coordinates[0],
      latitude: data.arrivalLocation?.coordinates[1],
    };
    this.guide = data.guide ? new GuideDto({ data: data.guide }) : undefined;
    this.travelTime = data.travelTime || 0;
    this.totalDistance = data.totalDistance || 0;
    this.rating = data.rating;
    this.points = data.points;
    this.reviews = data.reviewsCount || 0;
    this.minAge = data.minAge || undefined;
    this.maxAge = data.maxAge || undefined;
    this.minParticipants = data.minParticipants || undefined;
    this.maxParticipants = data.maxParticipants || undefined;
    this.recommendations = data.recommendations || undefined;
    this.howToDress = data.howToDress || undefined;
    this.restrictions = data.restrictions || undefined;
    this.categories = data.categories?.map(category => new CategoryDto(category));
    this.facilities = data.facilities?.map(facility => new FacilityDto(facility));
    this.images = data.images?.map(image => image.imageResource.url) || [];
    this.guides = data.guides || [];

    this.town = new TownDto(data.town);
    this.isPublic = data.isPublic;
    this.paymentMethods = data.paymentMethods || [];
    this.showBinntuReviews = data.showBinntuReviews ?? undefined;
    this.userReview = userReview;
    this.skippedOptionalFields = data.skippedOptionalFields ?? [];
    // status / completionPercentage / 3-indicator fields are populated by the
    // service via applyOwnerEnrichment when the caller is the owner.
  }
}
