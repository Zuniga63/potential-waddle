import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { parseArrayValue } from 'src/utils';
import { Transform } from 'class-transformer';

export class CreateLodgingDto {
  @ApiProperty({ description: 'Name of the place', example: '' })
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Slug of the place', example: '' })
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Town ID of the place',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  townId: string;

  @ApiProperty({ description: 'Address of the place', example: '' })
  @IsString()
  @IsNotEmpty()
  address: string;

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
  phoneNumbers: string[];

  @ApiProperty({ description: 'Email of the place', example: '' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Website of the place', example: '' })
  @IsUrl()
  @IsNotEmpty()
  website: string;

  @ApiProperty({ description: 'Description of the place', example: '' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: ['Viernes: 10:00-18:00', 'Sábado: 10:00-18:00', 'Domingo: 10:00-18:00'],
    description: 'List of opening hours of the lodging',
    readOnly: true,
    required: false,
    type: 'string',
    isArray: true,
  })
  openingHours: string[];

  @ApiProperty({
    example: 'How to get there',
    description: 'The way to get to the place',
    required: false,
  })
  howToGetThere?: string;

  @ApiProperty({
    example: 'Arrival reference',
    description: 'The arrival reference of the place',
    required: false,
  })
  arrivalReference?: string;

  @ApiProperty({
    example: 100,
    description: 'Urban center distance of the place in meters [m]',
    required: false,
  })
  urbanCenterDistance?: number;

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
  amenities: string[];

  @ApiProperty({
    example: 100,
    description: 'Lowest price of the lodging',
    required: false,
  })
  lowestPrice?: number;

  @ApiProperty({
    example: 100,
    description: 'Highest price of the lodging',
    required: false,
  })
  highestPrice?: number;

  @ApiProperty({
    example: ['English', 'Spanish'],
    description: 'List of languages spoken in the lodging',
    required: false,
  })
  spokenLanguages?: string[];

  @ApiProperty({
    example: 100,
    description: 'Longitude of the place',
    required: false,
  })
  longitude?: number;

  @ApiProperty({
    example: 100,
    description: 'Latitude of the place',
    required: false,
  })
  latitude?: number;

  @ApiProperty({
    example: 'https://maps.google.com',
    description: 'Google maps URL of the place',
    required: false,
  })
  googleMapsUrl?: string;

  @ApiProperty({
    example: ['123456789', '987654321'],
    description: 'List of WhatsApps of the lodging',
    required: false,
  })
  whatsappNumbers?: string[];

  @ApiProperty({
    example: 'https://facebook.com',
    description: 'Facebook URL of the lodging',
    required: false,
  })
  facebook?: string;

  @ApiProperty({
    example: 'https://instagram.com',
    description: 'Instagram URL of the lodging',
    required: false,
  })
  instagram?: string;

  @ApiProperty({
    description: 'Primary image of the place',
    type: 'string',
    format: 'binary',
    example: 'image.jpg',
  })
  imageFile: Express.Multer.File;
}
