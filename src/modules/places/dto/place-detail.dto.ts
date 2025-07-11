import { ApiProperty } from '@nestjs/swagger';

import { Place } from '../entities';
import { PlaceDto } from './place.dto';

interface Props {
  place?: Place;
  reviewId?: string;
}

export class PlaceDetailDto extends PlaceDto {
  @ApiProperty({
    example: 'https://goo.gl/maps/123',
    description: 'The Google Maps URL of the place',
    required: false,
  })
  googleMapsUrl?: Place['googleMapsUrl'];

  @ApiProperty({
    example: 'San Rafael is a town in the department of Antioquia, Colombia.',
    description: 'The history of the place',
    required: false,
  })
  history?: Place['history'];

  @ApiProperty({
    example: 20,
    description: 'The temperature of the place',
    required: false,
  })
  temperature?: Place['temperature'];

  @ApiProperty({
    example: 10,
    description: 'The maximum depth of the place',
    required: false,
  })
  maxDepth?: Place['maxDepth'];

  @ApiProperty({
    example: 1000,
    description: 'The altitude of the place',
    required: false,
  })
  altitude?: Place['altitude'];

  @ApiProperty({
    example: 100,
    description: 'The capacity of the place',
    required: false,
  })
  capacity?: Place['capacity'];

  @ApiProperty({
    example: 18,
    description: 'The minimum age of the place',
    required: false,
  })
  minAge?: Place['minAge'];

  @ApiProperty({
    example: 60,
    description: 'The maximum age of the place',
    required: false,
  })
  maxAge?: Place['maxAge'];

  @ApiProperty({
    example: 'How to get there',
    description: 'The way to get to the place',
    required: false,
  })
  howToGetThere?: Place['howToGetThere'];

  @ApiProperty({
    example: 'Transport reference',
    description: 'The transport reference of the place',
    required: false,
  })
  transportReference?: Place['transportReference'];

  @ApiProperty({
    example: 'Local transport options',
    description: 'The local transport options of the place',
    required: false,
  })
  localTransportOptions?: Place['localTransportOptions'];

  @ApiProperty({
    example: 'Arrival reference',
    description: 'The arrival reference of the place',
    required: false,
  })
  arrivalReference?: Place['arrivalReference'];

  @ApiProperty({
    example: 'Restrictions',
    description: 'The restrictions of the place',
    required: false,
  })
  restrictions?: Place['restrictions'];

  @ApiProperty({
    example: 'Observations',
    description: 'The observations of the place',
    required: false,
  })
  observations?: Place['observations'];

  @ApiProperty({
    example: 'Recommendations',
    description: 'The recommendations of the place',
    required: false,
  })
  recommendations?: Place['recommendations'];

  @ApiProperty({
    example: 100,
    description: 'The base points of the place',
    required: false,
  })
  basePoints?: Place['basePoints'];

  @ApiProperty({
    example: 100,
    description: 'The popularity of the place',
    required: false,
  })
  popularity?: Place['popularity'];

  latitude: number;
  longitude: number;

  urbarCenterDistance: number;

  howToDress: string;
  reviewCount: number;

  constructor({ place, reviewId }: Props) {
    super(place, reviewId);
    this.googleMapsUrl = place?.googleMapsUrl;
    this.history = place?.history;
    this.temperature = place?.temperature;
    this.maxDepth = place?.maxDepth;
    this.altitude = place?.altitude;
    this.capacity = place?.capacity;
    this.minAge = place?.minAge;
    this.maxAge = place?.maxAge;
    this.howToGetThere = place?.howToGetThere;
    this.transportReference = place?.transportReference;
    this.localTransportOptions = place?.localTransportOptions;
    this.arrivalReference = place?.arrivalReference;
    this.restrictions = place?.restrictions;
    this.observations = place?.observations;
    this.recommendations = place?.recommendations;
    this.basePoints = place?.basePoints;
    this.popularity = place?.popularity;
    this.latitude = place?.location?.coordinates[1] ?? 0;
    this.longitude = place?.location?.coordinates[0] ?? 0;
    this.urbarCenterDistance = place?.urbarCenterDistance ?? 0;
    this.googleMapsUrl = place?.googleMapsUrl ?? '';
    this.howToDress = place?.howToDress ?? '';
    this.reviewCount = place?.reviewCount ?? 0;
    this.images = (place?.images ?? [])
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
      }));
  }
}
