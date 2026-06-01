import { CommerceIndexDto } from './commerce-index.dto';
import { Commerce } from '../entities';
import { ApiProperty } from '@nestjs/swagger';
import { Facility } from 'src/modules/core/entities';
import { CommerceProductDto } from './commerce-product.dto';
import type {
  CommerceTermsStatusState,
  CommerceDocsStatusState,
} from '../utils/compute-commerce-completion';

// Owner-scoped sub-DTOs surfacing the 3-indicator completion model (mirror of LodgingFullDto).

export class CommerceTermsStatusDto {
  @ApiProperty({ enum: ['no_aplica', 'aceptados', 'pendientes'] })
  state: CommerceTermsStatusState;

  @ApiProperty({ type: String, nullable: true, required: false })
  activeTermsId?: string | null;
}

export class CommerceDocsStatusDto {
  @ApiProperty({ enum: ['no_requeridos', 'opcionales', 'incompletos', 'completos'] })
  state: CommerceDocsStatusState;

  @ApiProperty({ example: 2 })
  uploaded: number;

  @ApiProperty({ example: 3 })
  required: number;

  @ApiProperty({ type: [String] })
  missing: string[];
}

export class CommerceFullDto extends CommerceIndexDto {
  @ApiProperty({
    example: ['English', 'Spanish'],
    description: 'List of languages spoken in the lodging',
    required: false,
  })
  spokenLanguages?: string[];

  @ApiProperty({
    example: 'How to get there',
    description: 'The way to get to the place',
    required: false,
  })
  howToGetThere?: string;

  @ApiProperty({
    example: 'Arrival reference',
    description: 'The arrival reference of the place',
    required: false,
  })
  arrivalReference?: string;

  facilities?: Facility[];

  paymentMethods?: string[];
  services?: string[];

  @ApiProperty({
    example: 4.7,
    description: 'Google Maps rating of the lodging',
    required: false,
  })
  googleMapsRating?: number;

  @ApiProperty({
    example: 253,
    description: 'Number of reviews on Google Maps',
    required: false,
  })
  googleMapsReviewsCount?: number;

  @ApiProperty({
    example: true,
    description: 'Whether to show Google Maps reviews',
    required: false,
  })
  showGoogleMapsReviews?: boolean;

  @ApiProperty({
    description: 'Products and services of the commerce',
    type: [CommerceProductDto],
    required: false,
  })
  products?: CommerceProductDto[];

  // ------------------------------------------------------------------------------------------------
  // OWNER-SCOPED FIELDS (only populated when the requester is the owner)
  // ------------------------------------------------------------------------------------------------
  @ApiProperty({
    required: false,
    enum: ['draft', 'pending_review', 'published', 'rejected'],
    description: 'Workflow status. Owner-only.',
  })
  status?: 'draft' | 'pending_review' | 'published' | 'rejected';

  @ApiProperty({ required: false, type: Number, description: 'Alias of infoPercentage for backwards-compat.' })
  completionPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  missingFields?: string[];

  @ApiProperty({ required: false, type: Date, nullable: true })
  submittedAt?: Date | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  rejectionReason?: string | null;

  // ------------------------------------------------------------------------------------------------
  // 3-indicator completion (owner-only)
  // ------------------------------------------------------------------------------------------------
  @ApiProperty({ required: false, type: Number })
  infoPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  infoMissingFields?: string[];

  @ApiProperty({ required: false, type: Boolean })
  infoCriticalSatisfied?: boolean;

  @ApiProperty({ required: false, type: CommerceTermsStatusDto })
  termsStatus?: CommerceTermsStatusDto;

  @ApiProperty({ required: false, type: CommerceDocsStatusDto })
  docsStatus?: CommerceDocsStatusDto;

  @ApiProperty({ required: false, type: Boolean })
  readyToSubmit?: boolean;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Slugs of optional fields the owner marked "No tengo" (persisted server-side).',
  })
  skippedOptionalFields?: string[];

  constructor(commerce?: Commerce, userReview?: string) {
    super(commerce, userReview);

    if (!commerce) return;
    this.spokenLanguages = commerce.spokenLanguages;
    this.longitude = commerce.location?.coordinates[0];
    this.latitude = commerce.location?.coordinates[1];
    this.howToGetThere = commerce.howToGetThere || undefined;
    this.arrivalReference = commerce.arrivalReference || undefined;
    this.facilities = commerce.facilities;
    this.paymentMethods = commerce.paymentMethods;
    this.services = commerce.services;
    this.googleMapsRating = commerce.googleMapsRating || undefined;
    this.googleMapsReviewsCount = commerce.googleMapsReviewsCount || undefined;
    this.showGoogleMapsReviews = commerce.showGoogleMapsReviews || undefined;
    this.products = commerce.products?.map(product => new CommerceProductDto(product)) || [];
    this.skippedOptionalFields = commerce.skippedOptionalFields ?? [];
    // Status fields are populated by the service via applyOwnerEnrichment when the caller is the owner.
  }
}
