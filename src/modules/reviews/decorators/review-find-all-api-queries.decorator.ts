import { applyDecorators } from '@nestjs/common';
import { generateSortByOptions } from 'src/utils';
import { ReviewDomainsEnum, ReviewSortByEnum, ReviewStatusEnum } from '../enums';
import { ApiQuery } from '@nestjs/swagger';

export function ReviewFindAllApiQueries() {
  const { sortByEnum } = generateSortByOptions(ReviewSortByEnum);

  return applyDecorators(
    ApiQuery({ name: 'search', required: false, type: String, description: 'Search by username or email' }),
    ApiQuery({ name: 'sort-by', required: false, enum: sortByEnum, description: 'Sort by review properties' }),
    ApiQuery({ name: 'domain', required: false, description: 'Filter by domain', enum: ReviewDomainsEnum }),
    ApiQuery({ name: 'status', required: false, description: 'Filter by status', enum: ReviewStatusEnum }),
    ApiQuery({ name: 'town-id', required: false, description: 'Filter by town id' }),
    ApiQuery({ name: 'place-id', required: false, description: 'Filter by place id' }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Limit of items per page, by default is 25' }),
  );
}
