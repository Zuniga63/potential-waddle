import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto, FacilityDto } from 'src/modules/core/dto';
import { TownDto } from 'src/modules/towns/dto';
import { Place } from '../entities';

export class PlaceDto {
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
    description: 'The name of the place',
  })
  name: string;

  @ApiProperty({
    example: 'san-rafael',
    description: 'The slug of the place',
  })
  slug: string;

  @ApiProperty({
    example: 'San Rafael is a town in the department of Antioquia, Colombia.',
    description: 'The description of the place',
  })
  description: string;

  @ApiProperty({
    example: 6.2,
    description: 'The longitude of the place',
    readOnly: true,
    required: false,
  })
  longitude: number;

  @ApiProperty({
    example: 6.2,
    description: 'The longitude of the place',
    readOnly: true,
    required: false,
  })
  latitude: number;

  @ApiProperty({
    example: 'https://image.jpg',
    isArray: true,
    description: 'The image of the place',
    readOnly: true,
    required: false,
  })
  images: string[];

  @ApiProperty({
    description: 'List of categories of the place',
    readOnly: true,
    required: false,
    type: CategoryDto,
    isArray: true,
  })
  categories: CategoryDto[];

  @ApiProperty({
    description: 'List of facilities of the place',
    readOnly: true,
    required: false,
    type: FacilityDto,
    isArray: true,
  })
  facilities: FacilityDto[];

  @ApiProperty({
    example: 4,
    description: 'Difficulty level to reach the site in a range from 1 to 5',
    readOnly: true,
    required: false,
  })
  difficultyLevel: number;

  @ApiProperty({
    example: 4.5,
    description: 'Rating of the place, on a scale from 1 to 5',
    readOnly: true,
    required: false,
  })
  rating: number;

  @ApiProperty({
    example: 100,
    description: 'Score awarded for reaching the site, on a scale from 1 to 100',
    readOnly: true,
    required: false,
  })
  points: number;

  @ApiProperty({
    example: 100,
    description: 'The number of reviews of the place',
    readOnly: true,
    required: false,
  })
  reviewCount: number;

  @ApiProperty({
    example: 1340,
    description: 'The distance from the urban center of the town to the place',
    readOnly: true,
    required: false,
  })
  urbanCenterDistance: number;

  @ApiProperty({
    description: 'Indicates if the current user has reviews',
    example: 'uuid of the review',
    readOnly: true,
    required: false,
  })
  userReview?: string;

  @ApiProperty({
    format: 'date-time',
    example: '2021-09-03T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    format: 'date-time',
    example: '2021-09-03T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(place?: Place, userReview?: string, maxDistance: number = 0.1) {
    if (!place) return;
    const points = ((place.difficultyLevel * 0.4) + ((place.urbarCenterDistance / maxDistance) * 5 * 0.3) + (((6 - place.popularity) / 5) * 5 * 0.3)) * place.points;
    this.id = place.id;
    this.town = place.town && new TownDto(place.town);
    this.name = place.name;
    this.slug = place.slug;
    this.description = place.description;
    this.longitude = place.location?.coordinates[0];
    this.latitude = place.location?.coordinates[1];
    this.images = place.images?.map(image => image.imageResource?.url);
    this.categories = place.categories?.map(category => new CategoryDto(category));
    this.facilities = place.facilities?.map(facility => new FacilityDto(facility));
    this.difficultyLevel = place.difficultyLevel;
    this.rating = place.rating;
    this.points = points;
    this.reviewCount = place.reviewCount;
    this.urbanCenterDistance = place.urbarCenterDistance;
    this.userReview = userReview;
    this.createdAt = place.createdAt;
    this.updatedAt = place.updatedAt;
    
  }
}
