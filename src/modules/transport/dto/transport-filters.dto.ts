import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

import { parseArrayValue } from 'src/utils';

export class TransportFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID('4', { each: true })
  @IsArray()
  @Transform(({ value }) => parseArrayValue(value))
  @IsOptional()
  categories?: string[];
}
