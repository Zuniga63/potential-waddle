import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { TransportSortByEnum } from '../constants';

export function TransportListQueryDocsGroup() {
  const sortByDescription = `Valid values are: ${Object.values(TransportSortByEnum)
    .map(value => `-${value}, ${value}`)
    .join(', ')}`;

  return applyDecorators(
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'sortBy', required: false, description: sortByDescription }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
  );
}
