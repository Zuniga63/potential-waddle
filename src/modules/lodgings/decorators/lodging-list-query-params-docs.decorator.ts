import { ApiQuery } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

import { LodgingSortByEnum } from '../constants';

export function LodgingListQueryParamsDocs() {
  const sortByDescription = `Valid values are: ${Object.values(LodgingSortByEnum)
    .map(value => `-${value}, ${value}`)
    .join(', ')}`;

  return applyDecorators(
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'sort-by', required: false, description: sortByDescription }),
    ApiQuery({ name: 'town-id', required: false, type: String }),
    ApiQuery({ name: 'categories', required: false, type: [String] }),
    ApiQuery({ name: 'ratings', required: false, type: [Number] }),
    ApiQuery({ name: 'facilities', required: false, type: [String] }),
    ApiQuery({ name: 'distance-ranges', required: false, type: [String] }),
    ApiQuery({ name: 'price-ranges', required: false, type: [String] }),
  );
}
