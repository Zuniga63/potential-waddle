import { Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppPermissions, SwaggerTags } from 'src/config';
import { ReviewSortByEnum } from './enums';
import { ReviewsService } from './services';
import { AdminReviewsDto, ApproveReviewDto, ReviewFindAllQueriesDto } from './dto';
import { ReviewFindAllApiQueries } from './decorators';
import { GenericFindAllFilters, GetUser } from '../common/decorators';
import { Auth } from '../auth/decorators';
import { User } from '../users/entities';
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
  @Auth(AppPermissions.APPROVE_REVIEW)
  @ApiOkResponse({ description: 'Approve review', type: ApproveReviewDto })
  approve(@Param('id', new ParseUUIDPipe()) id: string, @GetUser() user: User) {
    return this.reviewsService.approve({ id, user });
  }
}
