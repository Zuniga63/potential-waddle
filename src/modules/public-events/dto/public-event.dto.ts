import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class TownDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

class UserDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;
}

class PublicEventPriceDto {
  @ApiProperty({
    description: 'Name of the price option',
    example: 'Entrada General',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Price value',
    example: 50.00,
  })
  @Expose()
  value: number;
}

class ImageDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  url: string;

  @ApiProperty()
  @Expose()
  isMain: boolean;

  @ApiProperty()
  @Expose()
  displayOrder: number;
}

export class PublicEventDto {
  @ApiProperty({
    description: 'UUID of the public event',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the event',
    example: 'Summer Music Festival 2024',
  })
  @Expose()
  eventName: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'summer-music-festival-2024',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Event description',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Video URL',
    required: false,
  })
  @Expose()
  video?: string;

  @ApiProperty({
    description: 'Event date',
    type: Date,
  })
  @Expose()
  date: Date;

  @ApiProperty({
    description: 'Event time',
  })
  @Expose()
  time: string;

  @ApiProperty({
    description: 'Event price',
    type: Number,
  })
  @Expose()
  price: number;

  @ApiProperty({
    description: 'Event prices',
    type: [PublicEventPriceDto],
  })
  @Expose()
  @Type(() => PublicEventPriceDto)
  prices: PublicEventPriceDto[];

  @ApiProperty({
    description: 'Event address',
  })
  @Expose()
  address: string;

  @ApiProperty({
    description: 'Location coordinates',
    required: false,
  })
  @Expose()
  location?: {
    longitude: number;
    latitude: number;
  };

  @ApiProperty({
    description: 'Responsible person',
  })
  @Expose()
  responsible: string;

  @ApiProperty({
    description: 'Contact information',
  })
  @Expose()
  contact: string;

  @ApiProperty({
    description: 'Registration link',
    required: false,
  })
  @Expose()
  registrationLink?: string;

  @ApiProperty({
    description: 'Active status',
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Town information',
    type: TownDto,
  })
  @Expose()
  @Type(() => TownDto)
  town: TownDto;

  @ApiProperty({
    description: 'User information',
    type: UserDto,
  })
  @Expose()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    description: 'Event images',
    type: [ImageDto],
  })
  @Expose()
  @Type(() => ImageDto)
  images: ImageDto[];

  @ApiProperty({
    description: 'Creation date',
    type: Date,
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    type: Date,
  })
  @Expose()
  updatedAt: Date;
}