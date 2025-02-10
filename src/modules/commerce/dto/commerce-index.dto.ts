import { ApiProperty } from '@nestjs/swagger';

import { Commerce } from '../entities';
import { CategoryDto } from 'src/modules/core/dto';
import { TownDto } from 'src/modules/towns/dto';

export class CommerceIndexDto {
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
    description: 'The name of the lodging',
  })
  name: string;

  @ApiProperty({
    example: 'san-rafael',
    description: 'The slug of the lodging',
  })
  slug: string;

  @ApiProperty({
    description: 'List of categories of the lodging',
    readOnly: true,
    required: false,
    type: CategoryDto,
    isArray: true,
  })
  categories: CategoryDto[];

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
    example: 'This ',
    description: 'The description of the lodging',
  })
  description: string;

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
    description: 'Indicates if the current user has review',
    example: 'uuid of the review',
    readOnly: true,
    required: false,
  })
  userReview?: string;

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

  constructor(commerce?: Commerce, userReview?: string) {
    if (!commerce) return;
    this.id = commerce.id;
    this.town = new TownDto(commerce.town);
    this.name = commerce.name;
    this.slug = commerce.slug;
    this.categories = commerce.categories.map(category => new CategoryDto(category));
    this.description = commerce.description || '';
    this.reviewsCount = 0;
    this.points = commerce.points;
    this.images = commerce.images.map(image => image.imageResource.url);
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
  }
}
