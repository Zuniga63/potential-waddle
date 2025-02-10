import { Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Validate } from 'class-validator';

import { parseArrayValue } from 'src/utils';
import { GuideSortByValidation } from '../utils/guide-sort-by.validation';

export class GuidesFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Validate(GuideSortByValidation)
  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsUUID()
  @IsOptional()
  townId?: string;

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
