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
    example: [
      {
        id: '624013aa-9555-4a69-bf08-30cf990c56dd',
        order: 1,
        isPublic: true,
        mediaFormat: 'image',
        videoUrl: null,
        imageResource: {
          id: '624013aa-9555-4a69-bf08-30cf990c56dd',
          url: 'https://image.jpg',
          publicId: 'folder/image_abc123',
          fileName: 'Place Name',
          width: 1920,
          height: 1080,
          format: 'jpg',
          resourceType: 'image',
          provider: 'Cloudinary',
        },
      },
    ],
    isArray: true,
    description: 'The images of the place with complete information',
    readOnly: true,
    required: false,
  })
  images: any[];

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

  @ApiProperty({
    example: true,
    description: 'Indicates if the place can be shown in the map',
    readOnly: true,
    required: false,
  })
  showLocation: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the place is featured',
    readOnly: true,
    required: false,
  })
  isFeatured: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the place is public',
    readOnly: true,
    required: false,
  })
  isPublic: boolean;

  constructor(place?: Place, userReview?: string) {
    if (!place) return;

    this.id = place.id;
    this.town = place.town && new TownDto(place.town);
    this.name = place.name;
    this.slug = place.slug;
    this.description = place.description;
    this.longitude = place.location?.coordinates[0];
    this.latitude = place.location?.coordinates[1];
    this.images = (place.images ?? [])
      .sort((a, b) => a.order - b.order)
      .map(image => ({
        id: image.id,
        order: image.order,
        isPublic: image.isPublic,
        mediaFormat: image.mediaFormat,
        videoUrl: image.videoUrl,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        imageResource: {
          id: image.imageResource?.id,
          url: image.imageResource?.url,
          publicId: image.imageResource?.publicId,
          fileName: image.imageResource?.fileName,
          width: image.imageResource?.width,
          height: image.imageResource?.height,
          format: image.imageResource?.format,
          resourceType: image.imageResource?.resourceType,
          provider: image.imageResource?.provider,
          createdAt: image.imageResource?.createdAt,
          updatedAt: image.imageResource?.updatedAt,
        },
      }))
      .slice(0, 4);
    this.categories = place.categories?.map(category => new CategoryDto(category));
    this.facilities = place.facilities?.map(facility => new FacilityDto(facility));
    this.difficultyLevel = place.difficultyLevel;
    this.rating = place.rating;
    this.points = place.points;
    this.reviewCount = place.reviewCount;
    this.urbanCenterDistance = place.urbarCenterDistance;
    this.userReview = userReview;
    this.showLocation = place.showLocation;
    this.isFeatured = place.isFeatured;
    this.createdAt = place.createdAt;
    this.updatedAt = place.updatedAt;
    this.isPublic = place.isPublic;
  }
}
