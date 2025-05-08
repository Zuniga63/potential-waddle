import { AppIconDto } from 'src/modules/core/dto';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

class LocationDto {
  @ApiProperty({
    description: 'Description of the location',
    example: 'Meeting point at the town square',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: '-73.935242',
    required: false,
  })
  @IsString()
  @IsOptional()
  longitude: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: '40.73061',
    required: false,
  })
  @IsString()
  @IsOptional()
  latitude: string;
}

export class CreateExperienceDto {
  @ApiProperty({
    description: 'UUID of the experience',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id: string;

  @ApiProperty({
    description: 'Title of the experience',
    example: 'Mountain Hiking Adventure',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug for the experience',
    example: 'mountain-hiking-adventure',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug: string;

  @ApiProperty({
    description: 'Detailed description of the experience',
    example: 'Join us for an exciting mountain hiking adventure...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Difficulty level of the experience',
    example: 'Moderate',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  difficultyLevel: string;

  @ApiProperty({
    description: 'Price of the experience',
    example: 99.99,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  price: number;

  @ApiProperty({
    description: 'Departure location details',
    type: LocationDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  departure?: {
    description?: string;
    longitude: number;
    latitude: number;
  };

  @ApiProperty({
    description: 'Arrival location details',
    type: LocationDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  arrival?: {
    description?: string;
    longitude: number;
    latitude: number;
  };

  @ApiProperty({
    description: 'Travel time in minutes',
    example: 120,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  travelTime: number;

  @ApiProperty({
    description: 'Total distance in kilometers',
    example: 8.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  totalDistance: number;

  @ApiProperty({
    description: 'Minimum age requirement',
    example: 12,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  minAge?: number;

  @ApiProperty({
    description: 'Maximum age limit',
    example: 70,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  maxAge?: number;

  @ApiProperty({
    description: 'Minimum number of participants',
    example: 2,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  minParticipants?: number;

  @ApiProperty({
    description: 'Maximum number of participants',
    example: 12,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  maxParticipants?: number;

  @ApiProperty({
    description: 'Recommendations for participants',
    example: 'Bring water and sunscreen',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  recommendations?: string;

  @ApiProperty({
    description: 'Clothing recommendations',
    example: 'Wear comfortable hiking shoes and layered clothing',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  howToDress?: string;

  @ApiProperty({
    description: 'Restrictions or limitations',
    example: 'Not suitable for people with heart conditions',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  restrictions?: string;

  @ApiProperty({
    description: 'Categories of the experience',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiProperty({
    description: 'Facilities available during the experience',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  facilityIds?: string[];

  @ApiProperty({
    description: 'Town where the experience takes place',
    type: 'string',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  townId: string;

  @ApiProperty({
    description: 'Icon for the experience',
    type: AppIconDto,
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => AppIconDto)
  icon?: AppIconDto;

  @ApiProperty({
    description: 'Guide leading the experience',
    type: 'string',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  guideId: string;

  @ApiProperty({
    description: 'Payment methods',
    example: ['cash', 'card'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  paymentMethods?: string[];

  @ApiProperty({
    description: 'Whether the experience is publicly visible',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
