import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseArrayValue } from 'src/utils';

export class CreateLodgingRoomTypeDto {
  @ApiProperty({ description: 'Name of the room type', example: 'Deluxe Double Room' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the room type',
    example: 'Spacious room with double bed and city view',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price per night', example: 150.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Maximum capacity of guests', example: 2 })
  @IsNumber()
  @Min(1)
  maxCapacity: number;

  @ApiProperty({ description: 'Number of beds', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  bedCount?: number;

  @ApiProperty({ description: 'Type of bed', example: 'double', required: false })
  @IsOptional()
  @IsString()
  bedType?: string;

  @ApiProperty({ description: 'Room size in square meters', example: 25.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  roomSize?: number;

  @ApiProperty({ description: 'Whether smoking is allowed', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  smokingAllowed?: boolean;

  @ApiProperty({ description: 'List of amenities', example: ['WiFi', 'Air Conditioning', 'Mini Bar'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => parseArrayValue(value))
  amenities?: string[];

  @ApiProperty({ description: 'Number of rooms of this type available', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  roomCount?: number;

  @ApiProperty({ description: 'Type of bathroom', example: 'private', required: false })
  @IsOptional()
  @IsString()
  bathroomType?: string;

  @ApiProperty({ description: 'Whether room has balcony', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  hasBalcony?: boolean;

  @ApiProperty({ description: 'Whether room has kitchen', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  hasKitchen?: boolean;

  @ApiProperty({ description: 'Whether room has air conditioning', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  hasAirConditioning?: boolean;

  @ApiProperty({ description: 'Whether room has WiFi', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @ApiProperty({ description: 'Type of view from room', example: 'sea view', required: false })
  @IsOptional()
  @IsString()
  view?: string;
}
