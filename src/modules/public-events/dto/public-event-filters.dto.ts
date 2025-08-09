import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PublicEventFiltersDto {
  @ApiProperty({
    description: 'Search term to filter events',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by town ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  townId?: string;

  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Filter events from this date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter events until this date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'Minimum price filter',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceMin?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceMax?: number;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort by field',
    required: false,
    default: 'startDate',
    enum: [
      'eventName',
      'startDate',
      'startTime',
      'endDate',
      'endTime',
      'price',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'startDate';

  @ApiProperty({
    description: 'Sort order',
    required: false,
    default: 'ASC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}