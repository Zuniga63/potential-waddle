import { ApiProperty } from '@nestjs/swagger';
import { LodgingRoomType } from '../entities';

export class LodgingRoomTypeDto {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Name of the room type', example: 'Deluxe Double Room' })
  name: string;

  @ApiProperty({
    description: 'Description of the room type',
    example: 'Spacious room with double bed and city view',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Price per night', example: 150.0 })
  price: number;

  @ApiProperty({ description: 'Maximum capacity of guests', example: 2 })
  maxCapacity: number;

  @ApiProperty({ description: 'Number of beds', example: 1, required: false })
  bedCount?: number;

  @ApiProperty({ description: 'Type of bed', example: 'double', required: false })
  bedType?: string;

  @ApiProperty({ description: 'Room size in square meters', example: 25.5, required: false })
  roomSize?: number;

  @ApiProperty({ description: 'Whether smoking is allowed', example: false, required: false })
  smokingAllowed?: boolean;

  @ApiProperty({ description: 'List of amenities', example: ['WiFi', 'Air Conditioning', 'Mini Bar'], required: false })
  amenities?: string[];

  @ApiProperty({ description: 'Number of rooms of this type available', example: 5, required: false })
  roomCount?: number;

  @ApiProperty({ description: 'Type of bathroom', example: 'private', required: false })
  bathroomType?: string;

  @ApiProperty({ description: 'Whether room has balcony', example: true, required: false })
  hasBalcony?: boolean;

  @ApiProperty({ description: 'Whether room has kitchen', example: false, required: false })
  hasKitchen?: boolean;

  @ApiProperty({ description: 'Whether room has air conditioning', example: true, required: false })
  hasAirConditioning?: boolean;

  @ApiProperty({ description: 'Whether room has WiFi', example: true, required: false })
  hasWifi?: boolean;

  @ApiProperty({ description: 'Type of view from room', example: 'sea view', required: false })
  view?: string;

  @ApiProperty({ description: 'Whether the room type is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  constructor(lodgingRoomType?: LodgingRoomType) {
    if (!lodgingRoomType) return;

    this.id = lodgingRoomType.id;
    this.name = lodgingRoomType.name;
    this.description = lodgingRoomType.description || undefined;
    this.price = lodgingRoomType.price;
    this.maxCapacity = lodgingRoomType.maxCapacity;
    this.bedCount = lodgingRoomType.bedCount || undefined;
    this.bedType = lodgingRoomType.bedType || undefined;
    this.roomSize = lodgingRoomType.roomSize || undefined;
    this.smokingAllowed = lodgingRoomType.smokingAllowed;
    this.amenities = lodgingRoomType.amenities;
    this.roomCount = lodgingRoomType.roomCount;
    this.bathroomType = lodgingRoomType.bathroomType || undefined;
    this.hasBalcony = lodgingRoomType.hasBalcony;
    this.hasKitchen = lodgingRoomType.hasKitchen;
    this.hasAirConditioning = lodgingRoomType.hasAirConditioning;
    this.hasWifi = lodgingRoomType.hasWifi;
    this.view = lodgingRoomType.view || undefined;
    this.isActive = lodgingRoomType.isActive;
    this.createdAt = lodgingRoomType.createdAt;
    this.updatedAt = lodgingRoomType.updatedAt;
  }
}
