import { Expose, Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, Max, Min, Validate } from 'class-validator';

import type { NumberRange } from 'src/modules/common/types';
import { parseArrayValue, parseNumberRangeFilterToArray, parseNumericFilterToArray } from 'src/utils';

import { ExperienceSortByValidation } from '../utils';

export class ExperienceFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Validate(ExperienceSortByValidation)
  @IsString()
  @Expose({ name: 'sort-by' })
  @IsOptional()
  sortBy?: string;

  @IsUUID()
  @Expose({ name: 'town-id' })
  @IsOptional()
  townId?: string;

  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  @IsOptional()
  categories?: string[];

  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  @IsOptional()
  facilities?: string[];

  @IsArray()
  @Max(5, { each: true })
  @Min(1, { each: true })
  @Transform(({ value }) => parseNumericFilterToArray({ value, min: 1, max: 5 }))
  @IsOptional()
  ratings?: number[];

  @IsArray()
  @Transform(({ value }) => parseNumberRangeFilterToArray(value))
  @Expose({ name: 'distance-ranges' })
  @IsOptional()
  distanceRanges?: NumberRange[];

  @IsArray()
  @Transform(({ value }) => parseNumberRangeFilterToArray(value))
  @Expose({ name: 'price-ranges' })
  @IsOptional()
  priceRanges?: NumberRange[];
}
