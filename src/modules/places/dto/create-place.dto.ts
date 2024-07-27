import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { parseArrayValue } from 'src/utils';

export class CreatePlaceDto {
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
    description: 'Primary image of the place',
    type: 'string',
    format: 'binary',
    example: 'image.jpg',
  })
  imageFile: Express.Multer.File;

  @ApiProperty({ description: 'Description of the place', example: '' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Corresponds to the level of difficulty to reach the site in a range from 1 to 5.' })
  @Max(5)
  @Min(1)
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  difficultyLevel: number;

  @ApiProperty({ description: 'This is the score awarded for reaching the site, on a scale from 1 to 100.' })
  @Max(100)
  @Min(1)
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  points: number;

  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- RELATIONSHIPS -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    description: 'Facilities IDs of the place',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  facilityIds?: string[];

  @ApiProperty({
    description: 'Categories IDs of the place',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  categoryIds?: string[];

  @ApiProperty({
    description: 'Town ID of the place',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  townId: string;
  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- LOCATION INFO -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    description: 'Longitude of the place',
    example: 6.217,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  longitude: number;

  @ApiProperty({
    description: 'Latitude of the place',
    example: 6.217,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({
    description: 'Urban center distance of the place in meters [m]',
    example: 100,
    required: false,
  })
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  urbanCenterDistance: number;

  @ApiProperty({
    description: 'Google maps link of the place',
    example: 'https://maps.google.com',
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @IsString()
  googleMapsUrl?: string;
  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- LOCATION INFO -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------

  @ApiProperty({
    description: 'If the place has interesting information or a history, please write it here.',
    required: false,
  })
  @IsString()
  @IsOptional()
  history?: string;

  @ApiProperty({
    description: 'Record average site temperature',
    example: 25,
    required: false,
  })
  @IsOptional()
  @Max(50)
  @Min(-50)
  @IsNumber()
  @Type(() => Number)
  temperature?: number;

  @ApiProperty({
    description: 'If the site has a lake or river, please specify the maximum reported depth.',
    example: 100,
    required: false,
  })
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxDepth?: number;

  @ApiProperty({
    description: 'Record the altitude of the site above sea level in meters',
    example: 1200,
    required: false,
  })
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  altitude?: number;

  @ApiProperty({
    description: 'Capacity of the place',
    required: false,
  })
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  capacity?: number;

  @ApiProperty({
    description: 'Min age recomended',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  minAge?: number;

  @ApiProperty({
    description: 'Max age recomended',
    example: 60,
    required: false,
  })
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxAge?: number;

  @ApiProperty({
    description: 'How to get there',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  howToGetThere?: string;

  @ApiProperty({
    description: 'Specify the types of transportation that can be used to reach the site.',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  transportReference?: string;

  @ApiProperty({
    description: 'Indicate the types of local transportation available to get to the site.',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  localTransportOptions?: string;

  @ApiProperty({
    description: 'Add directions or references to the place so that users can identify it.',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  arrivalReference?: string;

  @ApiProperty({
    description: 'Write recommendations for the users.',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  recommendations?: string;

  @ApiProperty({
    description: 'Clothing recommendations for visitors.',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  howToDress?: string;

  @ApiProperty({
    description: 'List the restrictions that users should be aware of.',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  restrictions?: string;

  @ApiProperty({
    description: 'Provide observations that users may wish to consider.',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  observations?: string;
  // * ----------------------------------------------------------------------------------------------------------------
  // * ------------------------------------- PUBLIC PROPERTY ----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    description: 'Is the place public',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  isPublic: boolean;
}
