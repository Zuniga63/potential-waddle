import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

import { LodgingSortByEnum } from '../constants';

export function LodgingListQueryParamsDocs() {
  const sortByDescription = `Valid values are: ${Object.values(LodgingSortByEnum)
    .map(value => `-${value}, ${value}`)
    .join(', ')}`;

  return applyDecorators(
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'sortBy', required: false, description: sortByDescription }),
    ApiQuery({ name: 'townId', required: false, type: String }),
    ApiQuery({ name: 'categories', required: false, type: [String] }),
    ApiQuery({ name: 'ratings', required: false, type: [Number] }),
    ApiQuery({ name: 'facilities', required: false, type: [String] }),
    ApiQuery({ name: 'distanceRanges', required: false, type: [String] }),
  );
}
