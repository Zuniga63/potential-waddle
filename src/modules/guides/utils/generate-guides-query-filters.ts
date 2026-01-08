import { ILike, In, type FindOptionsOrder, type FindOptionsWhere } from 'typeorm';

import { GuideSortByEnum } from '../constants';
import { Guide } from '../entities/guide.entity';
import { GuidesFiltersDto } from '../dto/guides-filters.dto';

export function generateGuideQueryFilters(filters?: GuidesFiltersDto) {
  const where: FindOptionsWhere<Guide> = {};
  const order: FindOptionsOrder<Guide> = { firstName: 'ASC' };

  if (!filters) return { where, order };

  const { search, sortBy, categories, townId } = filters;
  if (search) where.firstName = ILike(`%${search}%`);
  if (townId) where.towns = { id: townId };

  if (sortBy) {
    const sortOrder = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');
    delete order.firstName;

    if (field === GuideSortByEnum.NAME) order.firstName = sortOrder;
  }

  if (categories) where.categories = { id: In(categories) };
  return { where, order };
}
