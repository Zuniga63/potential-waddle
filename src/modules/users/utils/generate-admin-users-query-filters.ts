import {
  Between,
  ILike,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Or,
  type FindOptionsOrder,
  type FindOptionsWhere,
} from 'typeorm';

import { UserSortByEnum } from '../constants';
import { User } from '../entities/user.entity';
import { AdminUsersFiltersDto } from '../dto/admin-users-filters.dto';

export function generateAdminUsersQueryFilters(filters?: AdminUsersFiltersDto) {
  const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};
  const order: FindOptionsOrder<User> = { createdAt: 'DESC' };

  if (!filters) return { where, order };

  const { search, sortBy, isActive, isSuperUser, emailVerified, createdFrom, createdTo } = filters;

  // Search by username or email
  if (search) {
    const searchConditions: FindOptionsWhere<User>[] = [
      { username: ILike(`%${search}%`) },
      { email: ILike(`%${search}%`) },
    ];

    // Apply other filters to each search condition
    const baseFilters: FindOptionsWhere<User> = {};

    if (isActive !== undefined) baseFilters.isActive = isActive;
    if (isSuperUser !== undefined) baseFilters.isSuperUser = isSuperUser;
    if (emailVerified !== undefined) {
      baseFilters.emailVerifiedAt = emailVerified ? Not(IsNull()) : IsNull();
    }

    if (createdFrom && createdTo) {
      baseFilters.createdAt = Between(new Date(createdFrom), new Date(createdTo));
    } else if (createdFrom) {
      baseFilters.createdAt = MoreThanOrEqual(new Date(createdFrom));
    } else if (createdTo) {
      baseFilters.createdAt = LessThanOrEqual(new Date(createdTo));
    }

    return {
      where: searchConditions.map(condition => ({ ...condition, ...baseFilters })),
      order,
    };
  }

  // Apply filters without search
  if (isActive !== undefined) (where as FindOptionsWhere<User>).isActive = isActive;
  if (isSuperUser !== undefined) (where as FindOptionsWhere<User>).isSuperUser = isSuperUser;
  if (emailVerified !== undefined) {
    (where as FindOptionsWhere<User>).emailVerifiedAt = emailVerified ? Not(IsNull()) : IsNull();
  }

  // Date range filter
  if (createdFrom && createdTo) {
    (where as FindOptionsWhere<User>).createdAt = Between(new Date(createdFrom), new Date(createdTo));
  } else if (createdFrom) {
    (where as FindOptionsWhere<User>).createdAt = MoreThanOrEqual(new Date(createdFrom));
  } else if (createdTo) {
    (where as FindOptionsWhere<User>).createdAt = LessThanOrEqual(new Date(createdTo));
  }

  // Sorting
  if (sortBy) {
    const sortOrder = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');
    delete order.createdAt;

    if (field === UserSortByEnum.USERNAME) order.username = sortOrder;
    if (field === UserSortByEnum.EMAIL) order.email = sortOrder;
    if (field === UserSortByEnum.CREATED_AT) order.createdAt = sortOrder;
    if (field === UserSortByEnum.TOTAL_POINTS) order.totalPoints = sortOrder;
  }

  return { where, order };
}
