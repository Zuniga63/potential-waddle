import { Between, FindOptionsOrder, FindOptionsWhere, ILike, In, LessThanOrEqual, MoreThanOrEqual, Or } from 'typeorm';

import { Place } from '../entities';
import { PlaceSortByEnum } from '../constants';
import { PlaceFiltersDto } from '../dto/place-filters.dto';
import { BadRequestException } from '@nestjs/common';

export function generatePlaceQueryFilters(filters: PlaceFiltersDto) {
  const { search, sortBy, townId, categories, facilities, difficulties, ratings, distanceRanges } = filters;
  const where: FindOptionsWhere<Place> = {};
  const order: FindOptionsOrder<Place> = { name: 'ASC', images: { order: 'ASC' } };

  // * Handle search filter
  if (search) where.name = ILike(`%${search}%`);

  // * Handle sorting filter
  if (sortBy) {
    const sortOrder = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');
    delete order.name;

    if (field === PlaceSortByEnum.NAME) order.name = sortOrder;
    if (field === PlaceSortByEnum.RATING) order.rating = sortOrder;
    if (field === PlaceSortByEnum.DIFFICULTY) order.difficultyLevel = sortOrder;
    if (field === PlaceSortByEnum.DISTANCE) order.urbarCenterDistance = sortOrder;
    if (field === PlaceSortByEnum.POINTS) order.points = sortOrder;
  }

  // * Handle town filter
  if (townId) where.town = { id: townId };

  // * Handle categories filter
  if (categories) where.categories = { id: In(categories) };

  // * Handle facilities filter
  if (facilities) where.facilities = { id: In(facilities) };

  // * Handle difficulties filter
  if (difficulties) where.difficultyLevel = In(difficulties);

  // * Handle ratings filter
  if (ratings) {
    const tolerance = 0.06;
    const ranges = ratings.map(rating => {
      const min = rating === 1 ? 0 : rating - tolerance;
      const max = rating === 5 ? 5 : rating + 1 - tolerance;
      return Between(min, max);
    });

    where.rating = Or(...ranges);
  }

  // * Handle distanceRanges filter
  if (distanceRanges) {
    const ranges = distanceRanges.map(([min, max]) => {
      if (min === undefined && max === undefined) throw new BadRequestException('Both min and max cannot be undefined');

      if (max === undefined) return MoreThanOrEqual(min as number);
      if (min === undefined) return LessThanOrEqual(max as number);

      return Between(min as number, max as number);
    });
    where.urbarCenterDistance = Or(...ranges);
  }

  return { where, order };
}
