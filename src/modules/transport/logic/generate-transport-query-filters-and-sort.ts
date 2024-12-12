import { FindOptionsWhere, ILike } from 'typeorm';
import type { TransportFiltersDto } from '../dto';
import { Transport } from '../entities';

export function generateTransportQueryFiltersAndSort(filters?: TransportFiltersDto) {
  const where: FindOptionsWhere<Transport> = {};

  if (!filters) return { where };

  const { search } = filters;
  if (search) where.firstName = ILike(`%${search}%`);

  return { where };
}
