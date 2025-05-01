import { ApiProperty } from '@nestjs/swagger';

import { Pagination } from 'src/modules/common/interfaces';
import { GoogleReview } from '../entities/google-review.entity';
import { GoogleReviewDto } from './google-review.dto';

export class GoogleReviewsListDto implements Pagination {
  @ApiProperty({ default: 1, description: 'Current page' })
  currentPage: number;

  @ApiProperty({ default: 1, description: 'Total pages' })
  pages: number;

  @ApiProperty({ default: 0, description: 'Total count' })
  count: number;

  @ApiProperty({ type: [GoogleReviewDto] })
  data: GoogleReviewDto[];

  constructor(pagination: Pagination, googleReviews: GoogleReview[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = googleReviews.map(googleReview => new GoogleReviewDto({ data: googleReview }));
  }
}
