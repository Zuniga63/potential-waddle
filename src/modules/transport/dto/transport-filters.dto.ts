import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, Validate } from 'class-validator';

import { parseArrayValue } from 'src/utils';
import { TransportSortByValidation } from '../utils/transport-sort-by.validation';

export class TransportFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Validate(TransportSortByValidation)
  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  @IsOptional()
  categories?: string[];
}
