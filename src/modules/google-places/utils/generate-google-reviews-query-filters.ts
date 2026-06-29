import { MoreThanOrEqual, type FindOptionsOrder, type FindOptionsWhere } from 'typeorm';

import { GoogleReview } from '../entities/google-review.entity';
import { GoogleReviewSortByEnum } from '../constants';
import { GoogleReviewsFiltersDto } from '../dto/google-reviews-filters.dto';

export function generateReviewsQueryFilters(filters?: GoogleReviewsFiltersDto, entityId?: string, entityType?: string) {
  // Only rated reviews (rating >= 1) are listed/counted. Some scraped reviews
  // arrive without a star (Apify did not capture it); they are excluded here so
  // the list count matches the summary card and the distribution chart, and so
  // Binntu never reports more reviews than Google shows.
  const where: FindOptionsWhere<GoogleReview> = { rating: MoreThanOrEqual(1) };
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

  if (entityType === 'lodging' || entityType === 'restaurant' || entityType === 'commerce') {
    where.entityType = entityType;
  }

  return { where, order };
}
