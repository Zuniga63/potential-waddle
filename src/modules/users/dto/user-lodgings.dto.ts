import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from 'src/modules/core/dto';
import { Lodging } from 'src/modules/lodgings/entities';
import {
  computeLodgingCompletion,
  LodgingTermsStatus,
  LodgingDocsStatus,
} from 'src/modules/lodgings/utils/compute-lodging-completion';
import { LodgingTermsStatusDto, LodgingDocsStatusDto } from 'src/modules/lodgings/dto/lodging-full.dto';
import { TownDto } from 'src/modules/towns/dto';

export class UserLodgingDto {
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
    description: 'The name of the lodging',
  })
  name: string;

  @ApiProperty({
    example: 'san-rafael',
    description: 'The slug of the lodging',
  })
  slug: string;

  @ApiProperty({
    example: ['https://image.jpg'],
    isArray: true,
    description: 'The image of the lodging',
    readOnly: true,
    required: false,
    type: String,
  })
  images: string[];

  @ApiProperty({
    example: 13,
    description: 'The review counts of the lodging',
    readOnly: true,
    required: false,
  })
  reviewsCount: number;

  @ApiProperty({
    example: 100,
    description: 'Score awarded for reaching the lodging, on a scale from 1 to 100',
    readOnly: true,
    required: false,
  })
  points: number;

  @ApiProperty({
    example: 4.5,
    description: 'Rating of the lodging, on a scale from 1 to 5',
    readOnly: true,
    required: false,
  })
  rating: number;

  @ApiProperty({
    description: 'Minimum price of the lodging',
    readOnly: true,
    required: false,
    example: 10_000,
  })
  lowestPrice?: number;

  @ApiProperty({
    description: 'Maximum price of the lodging',
    readOnly: true,
    required: false,
    example: 100_000,
  })
  highestPrice?: number;

  @ApiProperty({
    example: '08:00-18:00',
    description: 'The opening hours of the lodging',
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
    example: true,
    description: 'Indicates if the lodging is public',
    readOnly: true,
    required: false,
  })
  isPublic: boolean;

  @ApiProperty({
    type: CategoryDto,
    isArray: true,
    description: 'The categories of the lodging',
    readOnly: true,
  })
  categories: CategoryDto[];

  @ApiProperty({
    example: 'draft',
    enum: ['draft', 'pending_review', 'published', 'rejected'],
    description: 'Onboarding lifecycle status of the lodging',
    readOnly: true,
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
  // 3-indicator completion model (see LodgingFullDto for full discussion). Populated when the
  // caller passes the precomputed termsStatus + docsStatus into the constructor.
  // ------------------------------------------------------------------------------------------------
  @ApiProperty({ required: false, type: Number, description: 'Info-only completion 0-100.' })
  infoPercentage?: number;

  @ApiProperty({ required: false, type: [String] })
  infoMissingFields?: string[];

  @ApiProperty({ required: false, type: Boolean })
  infoCriticalSatisfied?: boolean;

  @ApiProperty({ required: false, type: LodgingTermsStatusDto })
  termsStatus?: LodgingTermsStatusDto;

  @ApiProperty({ required: false, type: LodgingDocsStatusDto })
  docsStatus?: LodgingDocsStatusDto;

  @ApiProperty({ required: false, type: Boolean })
  readyToSubmit?: boolean;

  // ------------------------------------------------------------------------------------------------
  // Optional channel values — surfaced so the frontend can compute the "skip-penalty" % on the
  // dashboard cards / banner with the same logic as the wizard hook. Without these the UI would
  // show 100% on a list card while the wizard shows 92% for the same lodging.
  // ------------------------------------------------------------------------------------------------
  @ApiProperty({ required: false, type: String, nullable: true })
  facebook?: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  instagram?: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  website?: string | null;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Spoken languages (entity column spokenLanguages, surfaced as languages to match LodgingFullDto).',
  })
  languages?: string[];

  @ApiProperty({ required: false, type: String, nullable: true })
  arrivalReference?: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  howToGetThere?: string | null;

  // `places` count only — full array would inflate the payload. The penalty only cares whether
  // the field is "empty or not", so a length-equivalent value (the count) is enough.
  @ApiProperty({
    required: false,
    type: Number,
    description: 'Count of associated places (0 = empty for skip penalty).',
  })
  placesCount?: number;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Optional-field slugs the owner marked "No tengo" (persisted server-side).',
  })
  skippedOptionalFields?: string[];

  constructor(lodging?: Lodging, context?: { termsStatus: LodgingTermsStatus; docsStatus: LodgingDocsStatus }) {
    if (!lodging) return;
    this.id = lodging.id;
    this.town = new TownDto(lodging.town);
    this.name = lodging.name;
    this.slug = lodging.slug;
    this.reviewsCount = 0;
    this.points = lodging.points;
    this.images = lodging.images
      .sort((a, b) => a.order - b.order)
      .map(image => image.imageResource.url)
      .slice(0, 4);
    this.categories = lodging.categories.map(category => new CategoryDto(category));
    this.rating = lodging.rating;
    this.lowestPrice = lodging.lowestPrice || undefined;
    this.highestPrice = lodging.highestPrice || undefined;
    this.openingHours = lodging.openingHours || undefined;
    this.urbanCenterDistance = lodging.urbanCenterDistance || 0;
    this.isPublic = lodging.isPublic;
    this.status = lodging.status;

    const result = computeLodgingCompletion(lodging, context);
    this.completionPercentage = result.completionPercentage;
    this.infoPercentage = result.infoPercentage;
    this.infoMissingFields = result.infoMissingFields;
    this.infoCriticalSatisfied = result.infoCriticalSatisfied;
    if (result.termsStatus) this.termsStatus = result.termsStatus;
    if (result.docsStatus) this.docsStatus = result.docsStatus;
    if (result.readyToSubmit !== undefined) this.readyToSubmit = result.readyToSubmit;

    // Optional channels (for FE skip-penalty parity with the wizard)
    this.facebook = lodging.facebook ?? null;
    this.instagram = lodging.instagram ?? null;
    this.website = lodging.website ?? null;
    this.languages = lodging.spokenLanguages ?? [];
    this.arrivalReference = lodging.arrivalReference ?? null;
    this.howToGetThere = lodging.howToGetThere ?? null;
    this.placesCount = lodging.places?.length ?? 0;
    this.skippedOptionalFields = lodging.skippedOptionalFields ?? [];
  }
}
