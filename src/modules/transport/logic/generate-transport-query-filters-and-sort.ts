import { FindOptionsOrder, FindOptionsWhere, ILike } from 'typeorm';
import type { TransportFiltersDto } from '../dto';
import { Transport } from '../entities';
import { TransportSortByEnum } from '../constants';

export function generateTransportQueryFiltersAndSort(filters?: TransportFiltersDto) {
  const where: FindOptionsWhere<Transport> = {};
  const order: FindOptionsOrder<Transport> = { firstName: 'ASC' };
  if (!filters) return { where };

  const { search, sortBy } = filters;
  if (search) where.firstName = ILike(`%${search}%`);
  if (sortBy) {
    const sortOrder = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');
    delete order.firstName;

    if (field === TransportSortByEnum.NAME) order.firstName = sortOrder;
  }
  return { where, order };
}
