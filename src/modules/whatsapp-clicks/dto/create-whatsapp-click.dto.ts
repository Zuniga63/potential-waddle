import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EntityType {
  LODGING = 'lodging',
  RESTAURANT = 'restaurant',
  GUIDE = 'guide',
  EXPERIENCE = 'experience',
  TRANSPORT = 'transport',
  COMMERCE = 'commerce',
  PLACE = 'place',
}

export class CreateWhatsappClickDto {
  @ApiProperty({
    description: 'Entity ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Type of entity',
    enum: EntityType,
    example: 'lodging',
  })
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({
    description: 'Entity slug for analytics',
    example: 'hotel-campestre-binntu',
    required: false,
  })
  @IsString()
  @IsOptional()
  entitySlug?: string;

  @ApiProperty({
    description: 'WhatsApp phone number clicked',
    example: '573001234567',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'User ID if authenticated',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Browser session ID',
    example: 'abc123-session-xyz',
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
    required: false,
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    description: 'Latitude from geolocation',
    example: 4.6097,
    required: false,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude from geolocation',
    example: -74.0817,
    required: false,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Country from client',
    example: 'Colombia',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'City from client',
    example: 'Bogotá',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Referrer URL',
    example: 'https://google.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  referrer?: string;

  @ApiProperty({
    description: 'Time spent on page in seconds',
    example: 45,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  timeOnPage?: number;

  @ApiProperty({
    description: 'Page type (PLP for list pages, PDP for detail pages)',
    example: 'PDP',
    required: false,
  })
  @IsString()
  @IsOptional()
  pageType?: string;
}
