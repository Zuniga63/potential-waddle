import { Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from 'src/config';
import { ReviewSortByEnum } from './enums';
import { ReviewsService } from './services';
import { AdminReviewsDto, ReviewFindAllQueriesDto } from './dto';
import { ReviewFindAllApiQueries } from './decorators';
import { GenericFindAllFilters } from '../common/decorators';
// import { Auth } from '../auth/decorators';

@Controller('admin/reviews')
@ApiTags(SwaggerTags.Reviews)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  // @Auth(AppPermissions.READ_REVIEWS)
  @ReviewFindAllApiQueries()
  @ApiOkResponse({ description: 'Get all reviews', type: AdminReviewsDto })
  findAll(@GenericFindAllFilters(ReviewFindAllQueriesDto, ReviewSortByEnum) queries: ReviewFindAllQueriesDto) {
    return this.reviewsService.findAll({ queries });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * APPROVE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve review' })
  // @Auth(AppPermissions.UPDATE_REVIEW)
  @ApiOkResponse({ description: 'Approve review', type: AdminReviewsDto })
  approve(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reviewsService.approve({ id });
  }
}
