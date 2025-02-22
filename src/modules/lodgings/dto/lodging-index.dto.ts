import { ApiProperty } from '@nestjs/swagger';

import { Lodging } from '../entities';
import { CategoryDto } from 'src/modules/core/dto';
import { TownDto } from 'src/modules/towns/dto';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class LodgingIndexDto {
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
    example: 4,
    description: 'The number of rooms of the lodging',
    readOnly: true,
    required: false,
  })
  rooms: number;

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
    example: 'uuid of the user',
    description: 'The UUID of the user',
    readOnly: true,
    required: false,
  })
  user?: UserDto;

  @ApiProperty({
    example: true,
    description: 'Indicates if the lodging is public',
    readOnly: true,
    required: false,
  })
  isPublic: boolean;

  constructor(lodging?: Lodging, userReview?: string) {
    if (!lodging) return;
    this.id = lodging.id;
    this.town = new TownDto(lodging.town);
    this.name = lodging.name;
    this.slug = lodging.slug;
    this.categories = lodging.categories.map(category => new CategoryDto(category));
    this.description = lodging.description || '';
    this.reviewsCount = 0;
    this.points = lodging.points;
    this.rooms = lodging.roomCount;
    this.images = lodging.images
      .sort((a, b) => a.order - b.order)
      .map(image => image.imageResource.url)
      .slice(0, 4);

    this.rating = lodging.rating;
    this.user = new UserDto(lodging.user);
    this.lowestPrice = lodging.lowestPrice || undefined;
    this.highestPrice = lodging.highestPrice || undefined;
    this.userReview = userReview;
    this.openingHours = lodging.openingHours || undefined;
    this.urbanCenterDistance = lodging.urbanCenterDistance || 0;
    this.isPublic = lodging.isPublic;
  }
}
