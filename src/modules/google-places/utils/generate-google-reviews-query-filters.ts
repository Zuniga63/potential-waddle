import { type FindOptionsOrder, type FindOptionsWhere } from 'typeorm';

import { GoogleReview } from '../entities/google-review.entity';
import { GoogleReviewSortByEnum } from '../constants';
import { GoogleReviewsFiltersDto } from '../dto/google-reviews-filters.dto';

export function generateReviewsQueryFilters(filters?: GoogleReviewsFiltersDto, entityId?: string, entityType?: string) {
  const where: FindOptionsWhere<GoogleReview> = {};
  const order: FindOptionsOrder<GoogleReview> = {};

  if (!filters) return { where, order };
  console.log(filters, 'filters');
  const { sortBy } = filters;
  if (sortBy) {
    console.log(sortBy, 'sortBy');
    const sortOrder = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');
    delete order.rating;

    if (field === GoogleReviewSortByEnum.RATING) order.rating = sortOrder;
    if (field === GoogleReviewSortByEnum.REVIEW_DATE) order.reviewDate = sortOrder;
  }

  if (entityId) {
    where.entityId = entityId;
  }

  if (entityType === 'lodging' || entityType === 'restaurant') {
    where.entityType = entityType;
  }

  return { where, order };
}
