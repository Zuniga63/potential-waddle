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

import type { Experience } from '../entities';
import type { ExperienceFiltersDto } from '../dto';
import { ExperienceSortByEnum } from '../constants';

export function generateExperienceQueryFiltersAndSort(filters?: ExperienceFiltersDto) {
  const where: FindOptionsWhere<Experience> = {};
  const order: FindOptionsOrder<Experience> = { title: 'ASC', images: { order: 'ASC' } };

  if (!filters) return { where, order };

  const { search, sortBy, townId, categories, facilities, ratings, distanceRanges, priceRanges } = filters;
  if (search) where.title = ILike(`%${search}%`);

  if (sortBy) {
    const sortOrder = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');
    delete order.title;

    if (field === ExperienceSortByEnum.TITLE) order.title = sortOrder;
    if (field === ExperienceSortByEnum.RATING) order.rating = sortOrder;
    if (field === ExperienceSortByEnum.PRICE) order.price = sortOrder;
    if (field === ExperienceSortByEnum.DISTANCE) order.totalDistance = sortOrder;
    if (field === ExperienceSortByEnum.DIFFICULTY) order.difficultyLevel = sortOrder;
    if (field === ExperienceSortByEnum.POINTS) order.points = sortOrder;
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

    where.totalDistance = Or(...ranges);
  }

  if (priceRanges && priceRanges?.length > 0) {
    const ranges = priceRanges.map(([min, max]) => {
      if (min === undefined && max === undefined) throw new BadRequestException('Both min and max cannot be undefined');

      if (max === undefined) return MoreThanOrEqual(min as number);
      if (min === undefined) return LessThanOrEqual(max as number);

      return Between(min as number, max as number);
    });

    where.price = Or(...ranges);
  }

  return { where, order };
}
