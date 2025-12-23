import { CommerceIndexDto } from './commerce-index.dto';
import { Commerce } from '../entities';
import { ApiProperty } from '@nestjs/swagger';
import { Facility } from 'src/modules/core/entities';
import { CommerceProductDto } from './commerce-product.dto';

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
  }
}
