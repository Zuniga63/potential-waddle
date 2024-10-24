import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import { FilterSortBy } from 'src/modules/common/interfaces';
import { ReviewDomainsEnum, ReviewSortByEnum, ReviewStatusEnum } from '../enums';

export class ReviewFindAllQueriesDto {
  @IsOptional()
  @Expose()
  @IsString()
  search?: string;

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
  @Expose({ name: 'sort-by' })
  sortBy?: FilterSortBy<ReviewSortByEnum>;

  @IsOptional()
  @IsEnum(ReviewDomainsEnum)
  @Expose()
  domain?: ReviewDomainsEnum;

  @IsOptional()
  @IsEnum(ReviewStatusEnum)
  @Expose()
  status?: ReviewStatusEnum;

  @IsOptional()
  @IsUUID()
  @Expose({ name: 'town-id' })
  townId?: string;

  @IsOptional()
  @IsUUID()
  @Expose({ name: 'place-id' })
  placeId?: string;
}
