import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min, Validate } from 'class-validator';

import { PlaceSortByValidation } from '../utils';
import { NumberRange } from 'src/modules/common/types';
import { parseArrayValue, parseNumberRangeFilterToArray, parseNumericFilterToArray } from 'src/utils';

export class PlaceFiltersDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @IsOptional()
  @Validate(PlaceSortByValidation)
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsUUID()
  townId?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  categories?: string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  facilities?: string[];

  @IsOptional()
  @IsArray()
  @Max(5, { each: true })
  @Min(1, { each: true })
  @Transform(({ value }) => parseNumericFilterToArray({ value, min: 1, max: 5 }))
  ratings?: number[];

  @IsOptional()
  @IsArray()
  @Max(5, { each: true })
  @Min(1, { each: true })
  @Transform(({ value }) => parseNumericFilterToArray({ value, min: 1, max: 5 }))
  difficulties?: number[];

  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => parseNumberRangeFilterToArray(value))
  @IsOptional()
  distanceRanges?: NumberRange[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyFeatured?: boolean;
}
