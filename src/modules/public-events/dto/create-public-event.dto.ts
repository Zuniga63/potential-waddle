import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePublicEventDto {
  @ApiProperty({
    description: 'UUID of the public event',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Name of the event',
    example: 'Summer Music Festival 2024',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  eventName: string;

  @ApiProperty({
    description: 'URL-friendly slug for the event',
    example: 'summer-music-festival-2024',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Detailed description of the event',
    example: 'Join us for an unforgettable summer music festival...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Video URL for the event',
    example: 'https://www.youtube.com/watch?v=example',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  video?: string;

  @ApiProperty({
    description: 'Start date of the event',
    example: '2024-07-15',
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Start time of the event',
    example: '18:00',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End date of the event',
    example: '2024-07-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'End time of the event',
    example: '22:00',
    required: false,
  })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({
    description: 'Price of the event',
    example: 50.00,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 0 ? undefined : Number(value)))
  price?: number;

  @ApiProperty({
    description: 'Address of the event',
    example: '123 Main St, City',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @ApiProperty({
    description: 'Google Maps URL for the event location',
    example: 'https://goo.gl/maps/example',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  googleMapsUrl?: string;

  @ApiProperty({
    description: 'Person responsible for the event',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  responsible: string;

  @ApiProperty({
    description: 'Contact information',
    example: 'john@example.com or +1234567890',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contact: string;

  @ApiProperty({
    description: 'Registration link',
    example: 'https://example.com/register',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  registrationLink?: string;

  @ApiProperty({
    description: 'Town ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  townId: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}