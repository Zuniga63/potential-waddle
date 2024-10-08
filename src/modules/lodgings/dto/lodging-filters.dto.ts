import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min, Validate } from 'class-validator';

import { LodgingSortByValidation } from '../utils';
import { DistanceRange } from 'src/modules/common/types';
import { parseArrayValue, parseDistanceFilterToArray, parseNumericFilterToArray } from 'src/utils';

export class LodgingFiltersDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @IsOptional()
  @Validate(LodgingSortByValidation)
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

  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => parseDistanceFilterToArray(value))
  @IsOptional()
  distanceRanges?: DistanceRange[];
}
