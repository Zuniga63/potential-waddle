import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { GuideSortByEnum } from '../constants';

export function GuideListQueryDocsGroup() {
  const sortByDescription = `Valid values are: ${Object.values(GuideSortByEnum)
    .map(value => `-${value}, ${value}`)
    .join(', ')}`;

  return applyDecorators(
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'townId', required: false, type: String }),
    ApiQuery({ name: 'categories', required: false, type: [String] }),
    ApiQuery({ name: 'sortBy', required: false, description: sortByDescription }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
  );
}
