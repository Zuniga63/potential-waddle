import { Pagination } from 'src/modules/common/interfaces';
import { AdminReviewDto } from './admin-review.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../entities';

export class AdminReviewsDto implements Pagination {
  @ApiProperty({ default: 1, description: 'Current page' })
  currentPage: number;

  @ApiProperty({ default: 1, description: 'Total pages' })
  pages: number;

  @ApiProperty({ default: 0, description: 'Total count' })
  count: number;

  @ApiProperty({ type: [AdminReviewDto] })
  data: AdminReviewDto[];

  constructor(pagination: Pagination, reviews: Review[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = reviews.map(review => new AdminReviewDto(review));
  }
}
