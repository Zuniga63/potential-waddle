import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Validate } from 'class-validator';

import { UserSortByValidation } from '../utils/user-sort-by.validation';

export class AdminUsersFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Validate(UserSortByValidation)
  @IsString()
  @Expose({ name: 'sort-by' })
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

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @Expose({ name: 'is-active' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @Expose({ name: 'is-super-user' })
  isSuperUser?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @Expose({ name: 'email-verified' })
  emailVerified?: boolean;

  @IsOptional()
  @IsDateString()
  @Expose({ name: 'created-from' })
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  @Expose({ name: 'created-to' })
  createdTo?: string;
}
