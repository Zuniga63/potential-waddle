import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from 'src/modules/core/dto';
import { Restaurant } from 'src/modules/restaurants/entities';
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

  constructor(restaurant?: Restaurant) {
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
  }
}
