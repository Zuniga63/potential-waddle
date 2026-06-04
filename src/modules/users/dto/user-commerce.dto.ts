import { ApiProperty } from '@nestjs/swagger';

import { Commerce } from 'src/modules/commerce/entities';
import {
  computeCommerceCompletion,
  CommerceTermsStatus,
  CommerceDocsStatus,
} from 'src/modules/commerce/utils/compute-commerce-completion';
import { CommerceTermsStatusDto, CommerceDocsStatusDto } from 'src/modules/commerce/dto/commerce-full.dto';
import { CategoryDto } from 'src/modules/core/dto';
import { TownDto } from 'src/modules/towns/dto';

export class UserCommerceDto {
  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the commerce',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    type: TownDto,
    readOnly: true,
    required: false,
  })
  town?: TownDto;

  @ApiProperty({
    example: 'San Rafael',
    description: 'The name of the commerce',
  })
  name: string;

  @ApiProperty({
    example: 'san-rafael',
    description: 'The slug of the commerce',
  })
  slug: string;

  @ApiProperty({
    description: 'List of categories of the commerce',
    readOnly: true,
    required: false,
    type: CategoryDto,
    isArray: true,
  })
  categories: CategoryDto[];

  @ApiProperty({
    example: ['https://image.jpg'],
    isArray: true,
    description: 'The image of the commerce',
    readOnly: true,
    required: false,
    type: String,
  })
  images: string[];

  @ApiProperty({
    example: 'This ',
    description: 'The description of the commerce',
  })
  description: string;

  @ApiProperty({
    example: 13,
    description: 'The review counts of the commerce',
    readOnly: true,
    required: false,
  })
  reviewsCount: number;

  @ApiProperty({
    example: 100,
    description: 'Score awarded for reaching the commerce, on a scale from 1 to 100',
    readOnly: true,
    required: false,
  })
  points: number;

  @ApiProperty({
    example: 4.5,
    description: 'Rating of the commerce, on a scale from 1 to 5',
    readOnly: true,
    required: false,
  })
  rating: number;

  @ApiProperty({
    description: 'Indicates if the current user has review',
    example: 'uuid of the review',
    readOnly: true,
    required: false,
  })
  userReview?: string;

  @ApiProperty({
    example: '08:00-18:00',
    description: 'The opening hours of the commerce',
    readOnly: true,
    required: false,
  })
  openingHours?: string[];

  @ApiProperty({
    example: 1340,
    description: 'The distance from the urban center of the town to the place',
    readOnly: true,
    required: false,
  })
  urbanCenterDistance: number;

  @ApiProperty({
    example: ['123456789'],
    description: 'Phone numbers of the commerce',
    isArray: true,
    required: false,
    type: String,
  })
  phoneNumbers: string[];

  @ApiProperty({
    example: 'contact@commerce.com',
    description: 'Email of the commerce',
    required: false,
  })
  email: string | null;

  @ApiProperty({
    example: 'https://www.commerce.com',
    description: 'Website of the commerce',
    required: false,
  })
  website: string | null;

  @ApiProperty({
    example: 'https://facebook.com/commerce',
    description: 'Facebook profile of the commerce',
    required: false,
  })
  facebook: string | null;

  @ApiProperty({
    example: 'https://instagram.com/commerce',
    description: 'Instagram profile of the commerce',
    required: false,
  })
  instagram: string | null;

  @ApiProperty({
    example: ['123456789'],
    description: 'WhatsApp numbers of the commerce',
    isArray: true,
    required: false,
    type: String,
  })
  whatsappNumbers: string[];

  @ApiProperty({
    example: 'Av. Principal 123',
    description: 'Physical address of the commerce',
    required: false,
  })
  address: string | null;

  @ApiProperty({
    example: 'https://goo.gl/maps/example',
    description: 'Google Maps URL of the commerce',
    required: false,
  })
  googleMapsUrl: string | null;

  @ApiProperty({
    example: true,
    description: 'Indicates if the commerce is public',
    readOnly: true,
    required: false,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Onboarding lifecycle status of the commerce',
    enum: ['draft', 'pending_review', 'published', 'rejected'],
    required: false,
  })
  status?: 'draft' | 'pending_review' | 'published' | 'rejected';

  @ApiProperty({
    example: 80,
    description: 'Onboarding completion percentage (0-100). Alias of infoPercentage for backwards-compat.',
    readOnly: true,
    required: false,
  })
  completionPercentage?: number;

  // ------------------------------------------------------------------------------------------------
  // 3-indicator completion model (mirror of UserLodgingDto). Populated when the caller passes the
  // precomputed termsStatus + docsStatus into the constructor.
  // ------------------------------------------------------------------------------------------------
  @ApiProperty({ required: false, type: Number, description: 'Info-only completion 0-100.' })
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

  // ------------------------------------------------------------------------------------------------
  // Optional channels — surfaced so the frontend can compute the skip-penalty on the dashboard cards
  // with the same logic as the wizard hook.
  // ------------------------------------------------------------------------------------------------
  @ApiProperty({ required: false, type: [String] })
  spokenLanguages?: string[];

  @ApiProperty({ required: false, type: String, nullable: true })
  arrivalReference?: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  howToGetThere?: string | null;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Optional-field slugs the owner marked "No tengo" (persisted server-side).',
  })
  skippedOptionalFields?: string[];

  constructor(
    commerce?: Commerce,
    context?: { termsStatus: CommerceTermsStatus; docsStatus: CommerceDocsStatus },
    userReview?: string,
  ) {
    if (!commerce) return;
    this.id = commerce.id;
    this.town = new TownDto(commerce.town);
    this.name = commerce.name;
    this.slug = commerce.slug;
    this.categories = commerce.categories.map(category => new CategoryDto(category));
    this.description = commerce.description || '';
    this.reviewsCount = 0;
    this.points = commerce.points;
    this.images = commerce.images
      .sort((a, b) => a.order - b.order)
      .map(image => image.imageResource.url)
      .slice(0, 4);
    this.rating = commerce.rating;
    this.userReview = userReview;
    this.openingHours = commerce.openingHours || undefined;
    this.urbanCenterDistance = commerce.urbanCenterDistance || 0;
    this.phoneNumbers = commerce.phoneNumbers || [];
    this.email = commerce.email;
    this.website = commerce.website;
    this.facebook = commerce.facebook;
    this.instagram = commerce.instagram;
    this.whatsappNumbers = commerce.whatsappNumbers || [];
    this.address = commerce.address;
    this.googleMapsUrl = commerce.googleMapsUrl;
    this.isPublic = commerce.isPublic;
    this.status = commerce.status;

    const result = computeCommerceCompletion(commerce, context);
    this.completionPercentage = result.completionPercentage;
    this.infoPercentage = result.infoPercentage;
    this.infoMissingFields = result.infoMissingFields;
    this.infoCriticalSatisfied = result.infoCriticalSatisfied;
    if (result.termsStatus) this.termsStatus = result.termsStatus;
    if (result.docsStatus) this.docsStatus = result.docsStatus;
    if (result.readyToSubmit !== undefined) this.readyToSubmit = result.readyToSubmit;

    this.spokenLanguages = commerce.spokenLanguages ?? [];
    this.arrivalReference = commerce.arrivalReference ?? null;
    this.howToGetThere = commerce.howToGetThere ?? null;
    this.skippedOptionalFields = commerce.skippedOptionalFields ?? [];
  }
}
