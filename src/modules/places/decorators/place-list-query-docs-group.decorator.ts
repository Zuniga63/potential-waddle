import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { PlaceSortByEnum } from '../constants';

export function PlaceListQueryDocsGroup() {
  const sortByDescription = `Valid values are: ${Object.values(PlaceSortByEnum)
    .map(value => `-${value}, ${value}`)
    .join(', ')}`;

  return applyDecorators(
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'sortBy', required: false, description: sortByDescription }),
    ApiQuery({ name: 'townId', required: false, type: String }),
    ApiQuery({ name: 'categories', required: false, type: [String] }),
    ApiQuery({ name: 'difficulties', required: false, type: [Number] }),
    ApiQuery({ name: 'ratings', required: false, type: [Number] }),
    ApiQuery({ name: 'facilities', required: false, type: [String] }),
    ApiQuery({ name: 'distanceRanges', required: false, type: [String] }),
    ApiQuery({ name: 'onlyFeatured', required: false, type: Boolean }),
  );
}
