import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from 'src/modules/core/dto';
import { Restaurant } from 'src/modules/restaurants/entities';
import {
  computeRestaurantCompletion,
  RestaurantTermsStatus,
  RestaurantDocsStatus,
} from 'src/modules/restaurants/utils/compute-restaurant-completion';
import { RestaurantTermsStatusDto, RestaurantDocsStatusDto } from 'src/modules/restaurants/dto/restaurant.dto';
import { TownDto } from 'src/modules/towns/dto';

export class UserRestaurantDto {
  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the place',
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
    description: 'The name of the restaurant',
  })
  name: string;

  @ApiProperty({
    example: 'san-rafael',
    description: 'The slug of the restaurant',
  })
  slug: string;

  @ApiProperty({
    example: ['https://image.jpg'],
    isArray: true,
    description: 'The image of the restaurant',
    readOnly: true,
    required: false,
    type: String,
  })
  images: string[];

  @ApiProperty({
    example: 13,
    description: 'The review counts of the restaurant',
    readOnly: true,
    required: false,
  })
  reviewsCount: number;

  @ApiProperty({
    example: 100,
    description: 'Score awarded for reaching the restaurant, on a scale from 1 to 100',
    readOnly: true,
    required: false,
  })
  points: number;

  @ApiProperty({
    example: 4.5,
    description: 'Rating of the restaurant, on a scale from 1 to 5',
    readOnly: true,
    required: false,
  })
  rating: number;

  @ApiProperty({
    description: 'Minimum price of the restaurant',
    readOnly: true,
    required: false,
    example: 10_000,
  })
  lowestPrice?: number;

  @ApiProperty({
    description: 'Maximum price of the restaurant',
    readOnly: true,
    required: false,
    example: 100_000,
  })
  highestPrice?: number;

  @ApiProperty({
    example: '08:00-18:00',
    description: 'The opening hours of the restaurant',
    readOnly: true,
    required: false,
  })
  openingHours?: string[];

  @ApiProperty({
    example: true,
    description: 'Indicates if the restaurant is public',
    readOnly: true,
    required: false,
  })
  isPublic: boolean;

  @ApiProperty({
    type: CategoryDto,
    isArray: true,
    description: 'The categories of the restaurant',
    readOnly: true,
  })
  categories: CategoryDto[];

  @ApiProperty({
    description: 'Onboarding lifecycle status of the restaurant',
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

  @ApiProperty({ required: false, type: RestaurantTermsStatusDto })
  termsStatus?: RestaurantTermsStatusDto;

  @ApiProperty({ required: false, type: RestaurantDocsStatusDto })
  docsStatus?: RestaurantDocsStatusDto;

  @ApiProperty({ required: false, type: Boolean })
  readyToSubmit?: boolean;

  // ------------------------------------------------------------------------------------------------
  // Optional channels — surfaced so the frontend can compute the skip-penalty on the dashboard cards
  // with the same logic as the wizard hook.
  // ------------------------------------------------------------------------------------------------
  @ApiProperty({ required: false, type: String, nullable: true })
  facebook?: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  instagram?: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  website?: string | null;

  @ApiProperty({ required: false, type: [String] })
  spokenLanguages?: string[];

  @ApiProperty({ required: false, type: String, nullable: true })
  howToGetThere?: string | null;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Optional-field slugs the owner marked "No tengo" (persisted server-side).',
  })
  skippedOptionalFields?: string[];

  constructor(
    restaurant?: Restaurant,
    context?: { termsStatus: RestaurantTermsStatus; docsStatus: RestaurantDocsStatus },
  ) {
    if (!restaurant) return;
    this.id = restaurant.id;
    this.town = new TownDto(restaurant.town);
    this.name = restaurant.name;
    this.slug = restaurant.slug;
    this.reviewsCount = 0;
    this.points = restaurant.points;
    this.images =
      restaurant.images
        ?.sort((a, b) => a.order - b.order)
        .map(image => image.imageResource.url)
        .slice(0, 4) || [];
    this.categories = restaurant.categories?.map(category => new CategoryDto(category)) || [];
    this.rating = restaurant.rating;
    this.lowestPrice = restaurant.lowestPrice || undefined;
    this.highestPrice = restaurant.higherPrice || undefined;
    this.openingHours = restaurant.openingHours || undefined;
    this.isPublic = restaurant.isPublic;
    this.status = restaurant.status;

    const result = computeRestaurantCompletion(restaurant, context);
    this.completionPercentage = result.completionPercentage;
    this.infoPercentage = result.infoPercentage;
    this.infoMissingFields = result.infoMissingFields;
    this.infoCriticalSatisfied = result.infoCriticalSatisfied;
    if (result.termsStatus) this.termsStatus = result.termsStatus;
    if (result.docsStatus) this.docsStatus = result.docsStatus;
    if (result.readyToSubmit !== undefined) this.readyToSubmit = result.readyToSubmit;

    this.facebook = restaurant.facebook ?? null;
    this.instagram = restaurant.instagram ?? null;
    this.website = restaurant.website ?? null;
    this.spokenLanguages = restaurant.spokenLanguages ?? [];
    this.howToGetThere = restaurant.howToGetThere ?? null;
    this.skippedOptionalFields = restaurant.skippedOptionalFields ?? [];
  }
}
