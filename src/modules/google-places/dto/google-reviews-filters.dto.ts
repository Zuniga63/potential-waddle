import { Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Validate } from 'class-validator';

import { parseArrayValue } from 'src/utils';
import { GoogleReviewSortByValidation } from '../utils/google-reviews-sort-by.validation';

export class GoogleReviewsFiltersDto {
  @Validate(GoogleReviewSortByValidation)
  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  limit?: number;

  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  @IsOptional()
  categories?: string[];
}
