import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { parseArrayValue } from 'src/utils';
import { Transform } from 'class-transformer';

export class CreateLodgingDto {
  @ApiProperty({ description: 'Slug of the place', example: '' })
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Name of the place', example: '' })
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User ID of the place', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID('4')
  user?: string;

  @ApiProperty({
    description: 'Town ID of the place',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  townId?: string;

  @ApiProperty({ description: 'Address of the place', example: '' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Categories IDs of the place',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  categoryIds?: string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  facilityIds?: string[];

  @ApiProperty({
    example: ['123456789', '987654321'],
    description: 'List of phones of the lodging',
    readOnly: true,
    required: false,
    type: 'string',
    isArray: true,
  })
  @IsOptional()
  phoneNumbers?: string[];

  @ApiProperty({ description: 'Email of the place', example: '' })
  @ValidateIf(o => o.email !== null && o.email !== '')
  @IsEmail(undefined, { message: 'Invalid email format' })
  @IsOptional()
  email?: string | null;

  @ApiProperty({ description: 'Website of the place', example: '' })
  @ValidateIf(o => o.website !== null && o.website !== '')
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Description of the place', example: '' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['Viernes: 10:00-18:00', 'Sábado: 10:00-18:00', 'Domingo: 10:00-18:00'],
    description: 'List of opening hours of the lodging',
    readOnly: true,
    required: false,
    type: 'string',
    isArray: true,
  })
  @IsOptional()
  openingHours?: string[];

  @ApiProperty({
    example: 'How to get there',
    description: 'The way to get to the place',
    required: false,
  })
  @IsOptional()
  howToGetThere?: string;

  @ApiProperty({
    example: 'Arrival reference',
    description: 'The arrival reference of the place',
    required: false,
  })
  @IsOptional()
  arrivalReference?: string;

  @ApiProperty({
    example: 100,
    description: 'Urban center distance of the place in meters [m]',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  urbanCenterDistance?: number;

  @IsOptional()
  @ApiProperty({
    example: ['Single', 'Double', 'Triple'],
    description: 'List of room types of the lodging',
    readOnly: true,
    required: false,
    type: 'string',
    isArray: true,
  })
  roomTypes: string[];

  @ApiProperty({
    example: ['WiFi', 'Parking', 'Pool'],
    description: 'List of amenities of the lodging',
    readOnly: true,
    required: false,
    type: 'string',
    isArray: true,
  })
  @IsOptional()
  amenities?: string[];

  @ApiProperty({
    example: 100,
    description: 'Lowest price of the lodging',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  lowestPrice?: number;

  @ApiProperty({
    example: 100,
    description: 'Highest price of the lodging',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  highestPrice?: number;

  @ApiProperty({
    example: ['English', 'Spanish'],
    description: 'List of languages spoken in the lodging',
    required: false,
  })
  @IsOptional()
  spokenLanguages?: string[];

  @ApiProperty({
    example: 100,
    description: 'Longitude of the place',
    required: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  longitude: number;

  @ApiProperty({
    example: 100,
    description: 'Latitude of the place',
    required: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  latitude: number;

  @ApiProperty({
    example: 'https://maps.google.com',
    description: 'Google maps URL of the place',
    required: false,
  })
  @IsOptional()
  googleMapsUrl?: string;

  @ApiProperty({
    example: ['123456789', '987654321'],
    description: 'List of WhatsApps of the lodging',
    required: false,
  })
  @IsOptional()
  whatsappNumbers?: string[];

  @ApiProperty({
    example: 'https://facebook.com',
    description: 'Facebook URL of the lodging',
    required: false,
  })
  @ValidateIf(o => o.facebook !== null && o.facebook !== '')
  @IsOptional()
  facebook?: string;

  @ApiProperty({
    example: 'https://instagram.com',
    description: 'Instagram URL of the lodging',
    required: false,
  })
  @ValidateIf(o => o.instagram !== null && o.instagram !== '')
  @IsOptional()
  instagram?: string;

  @ApiProperty({
    description: 'Primary image of the place',
    type: 'string',
    format: 'binary',
    example: 'image.jpg',
  })
  @IsOptional()
  imageFile?: Express.Multer.File;

  @ApiProperty({
    example: 100,
    description: 'Capacity of the lodging',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  capacity?: number;

  @ApiProperty({
    example: 100,
    description: 'Room count of the lodging',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  roomCount?: number;

  @ApiProperty({
    example: ['cash', 'card'],
    description: 'Payment methods',
    required: false,
  })
  @IsOptional()
  paymentMethods?: string[];
}
