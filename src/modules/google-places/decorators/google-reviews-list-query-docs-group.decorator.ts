import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { GoogleReviewSortByEnum } from '../constants';

export function GoogleReviewsListQueryDocsGroup() {
  const sortByDescription = `Valid values are: ${Object.values(GoogleReviewSortByEnum)
    .map(value => `-${value}, ${value}`)
    .join(', ')}`;

  return applyDecorators(
    ApiQuery({ name: 'sortBy', required: false, description: sortByDescription }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
  );
}
