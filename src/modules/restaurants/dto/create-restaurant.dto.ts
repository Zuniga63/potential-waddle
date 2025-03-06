import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({
    description: 'Name of the restaurant',
    example: 'Seaside Grill',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the restaurant',
    example: 'seaside-grill',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug: string;

  @ApiProperty({
    description: 'Detailed description of the restaurant',
    example: 'A beautiful restaurant with ocean views...',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: '40.73061',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  latitude: string;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: '-73.935242',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  longitude: string;

  @ApiProperty({
    description: 'Address of the restaurant',
    example: '123 Ocean Drive',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiProperty({
    description: 'Phone numbers',
    example: ['+1234567890', '+0987654321'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  phoneNumbers?: string[];

  @ApiProperty({
    description: 'WhatsApp numbers',
    example: ['+1234567890'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  whatsappNumbers?: string[];

  @ApiProperty({
    description: 'Opening hours',
    example: ['Mon-Fri: 9AM-10PM', 'Sat-Sun: 10AM-11PM'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  openingHours?: string[];

  @ApiProperty({
    description: 'Email address',
    example: 'contact@seasidegrill.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Website URL',
    example: 'https://www.seasidegrill.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Instagram handle',
    example: 'seasidegrill',
    required: false,
  })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiProperty({
    description: 'Facebook handle',
    example: 'seasidegrill',
    required: false,
  })
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiProperty({
    description: 'Lowest price range',
    example: 15.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  lowestPrice?: number;

  @ApiProperty({
    description: 'Higher price range',
    example: 45.99,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  higherPrice?: number;

  @ApiProperty({
    description: 'Distance from urban center in meters',
    example: 1500,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  urbanCenterDistance?: number;

  @ApiProperty({
    description: 'Google Maps URL',
    example: 'https://goo.gl/maps/abcdef123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  googleMapsUrl?: string;

  @ApiProperty({
    description: 'Instructions on how to get to the restaurant',
    example: 'Take the coastal road and turn right at the lighthouse',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  howToGetThere?: string;

  @ApiProperty({
    description: 'Zone within the town',
    example: 'Beachfront',
    required: false,
  })
  @IsString()
  @IsOptional()
  townZone?: string;

  @ApiProperty({
    description: 'Languages spoken at the restaurant',
    example: ['English', 'Spanish', 'French'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  spokenLanguages?: string[];

  @ApiProperty({
    description: 'Categories of the restaurant',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiProperty({
    description: 'Facilities available at the restaurant',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  facilityIds?: string[];

  @ApiProperty({
    description: 'Town where the restaurant is located',
    type: 'string',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  townId?: string;

  @ApiProperty({
    description: 'Place where the restaurant is located',
    type: 'string',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  placeId?: string;

  @ApiProperty({
    description: 'User who owns/manages the restaurant',
    type: 'string',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Payment methods',
    example: ['cash', 'card'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  paymentMethods?: string[];

  @ApiProperty({
    description: 'Whether the restaurant is publicly visible',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
