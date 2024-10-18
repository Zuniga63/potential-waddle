import {
  Between,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Or,
  type FindOptionsOrder,
  type FindOptionsWhere,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import type { Restaurant } from '../entities';
import type { RestaurantFiltersDto } from '../dto';
import { RestaurantSortByEnum } from '../constants';

export function generateRestaurantQueryFiltersAndSort(filters?: RestaurantFiltersDto) {
  const where: FindOptionsWhere<Restaurant> = {};
  const order: FindOptionsOrder<Restaurant> = { name: 'ASC', images: { order: 'ASC' } };

  if (!filters) return { where, order };

  const { search, sortBy, townId, categories, facilities, ratings, distanceRanges, priceRanges } = filters;
  if (search) where.name = ILike(`%${search}%`);

  if (sortBy) {
    const sortOrder = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');
    delete order.name;

    if (field === RestaurantSortByEnum.NAME) order.name = sortOrder;
    if (field === RestaurantSortByEnum.RATING) order.rating = sortOrder;
    if (field === RestaurantSortByEnum.PRICE) order.lowestPrice = sortOrder;
    if (field === RestaurantSortByEnum.DISTANCE) order.urbanCenterDistance = sortOrder;
  }

  if (townId) where.town = { id: townId };

  if (categories) where.categories = { id: In(categories) };

  if (facilities) where.facilities = { id: In(facilities) };

  if (ratings) {
    const tolerance = 0.06;
    const ranges = ratings.map(rating => {
      const min = rating === 1 ? 0 : rating - tolerance;
      const max = rating === 5 ? 5 : rating + 1 - tolerance;
      return Between(min, max);
    });

    where.rating = Or(...ranges);
  }

  if (distanceRanges && distanceRanges?.length > 0) {
    const ranges = distanceRanges.map(([min, max]) => {
      if (min === undefined && max === undefined) throw new BadRequestException('Both min and max cannot be undefined');

      if (max === undefined) return MoreThanOrEqual(min as number);
      if (min === undefined) return LessThanOrEqual(max as number);

      return Between(min as number, max as number);
    });

    where.urbanCenterDistance = Or(...ranges);
  }

  if (priceRanges && priceRanges?.length > 0) {
    const ranges = priceRanges.map(([min, max]) => {
      if (min === undefined && max === undefined) throw new BadRequestException('Both min and max cannot be undefined');

      if (max === undefined) return MoreThanOrEqual(min as number);
      if (min === undefined) return LessThanOrEqual(max as number);

      return Between(min as number, max as number);
    });

    where.lowestPrice = Or(...ranges);
  }

  return { where, order };
}
