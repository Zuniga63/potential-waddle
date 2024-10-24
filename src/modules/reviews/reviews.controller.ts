import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from 'src/config';
import { ReviewSortByEnum } from './enums';
import { ReviewsService } from './services';
import { ReviewFindAllQueriesDto } from './dto';
import { ReviewFindAllApiQueries } from './decorators';
import { GenericFindAllFilters } from '../common/decorators';

@Controller('reviews')
@ApiTags(SwaggerTags.Reviews)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ReviewFindAllApiQueries()
  findAll(@GenericFindAllFilters(ReviewFindAllQueriesDto, ReviewSortByEnum) queries: ReviewFindAllQueriesDto) {
    return this.reviewsService.findAll({ queries });
  }
}
