import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';
import { GetUser } from '../common/decorators';
import { User } from '../users/entities';
import { EntityReviewsService } from './services';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { ReviewDomainsEnum, ReviewStatusEnum } from './enums';
import { SwaggerTags } from 'src/config';

// * ----------------------------------------------------------------------------------------------------------------
// * LODGING REVIEWS CONTROLLER
// * ----------------------------------------------------------------------------------------------------------------
@Controller('lodgings')
@ApiTags(SwaggerTags.Reviews)
export class LodgingReviewsController {
  constructor(private readonly entityReviewsService: EntityReviewsService) {}

  @Post(':id/reviews')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review created successfully' })
  create(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.create({
      entityType: ReviewDomainsEnum.LODGINGS,
      entityId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Get(':id/reviews')
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  findAll(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.findAll({
      entityType: ReviewDomainsEnum.LODGINGS,
      entityId,
      status: ReviewStatusEnum.APPROVED,
    });
  }

  @Get(':id/reviews/owner')
  @Auth()
  @ApiOkResponse({ description: 'Owner reviews retrieved successfully' })
  findAllForOwner(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReviewStatusEnum,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.entityReviewsService.findAllForOwner({
      entityType: ReviewDomainsEnum.LODGINGS,
      entityId,
      userId: user.id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
      sortBy,
    });
  }

  @Get(':id/reviews/me')
  @Auth()
  @ApiOkResponse({ description: 'User review retrieved successfully' })
  findUserReview(@Param('id', ParseUUIDPipe) entityId: string, @GetUser() user: User) {
    return this.entityReviewsService.findUserReview({
      entityType: ReviewDomainsEnum.LODGINGS,
      entityId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review retrieved successfully' })
  findOne(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.findOne({
      entityType: ReviewDomainsEnum.LODGINGS,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Patch(':id/reviews/:reviewId')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.update({
      entityType: ReviewDomainsEnum.LODGINGS,
      entityId,
      reviewId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Delete(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review deleted successfully' })
  remove(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.remove({
      entityType: ReviewDomainsEnum.LODGINGS,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  // Charts & Analytics Endpoints
  @Get(':id/reviews/analytics/distribution')
  @ApiOkResponse({ description: 'Reviews distribution by rating' })
  getReviewsDistribution(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByRating(ReviewDomainsEnum.LODGINGS, entityId);
  }

  @Get(':id/reviews/analytics/by-year')
  @ApiOkResponse({ description: 'Reviews count by year' })
  getReviewsByYear(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByYear(ReviewDomainsEnum.LODGINGS, entityId);
  }

  @Get(':id/reviews/analytics/by-month')
  @ApiOkResponse({ description: 'Reviews count by month (current year)' })
  getReviewsByMonth(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByMonth(ReviewDomainsEnum.LODGINGS, entityId);
  }

  @Get(':id/reviews/analytics/trend')
  @ApiOkResponse({ description: 'Rating trend over time' })
  getRatingTrend(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsRatingTrend(ReviewDomainsEnum.LODGINGS, entityId);
  }

  @Get(':id/reviews/analytics/metrics')
  @ApiOkResponse({ description: 'Aggregate metrics for reviews' })
  getReviewsMetrics(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsMetrics(ReviewDomainsEnum.LODGINGS, entityId);
  }

  @Post(':id/reviews/analytics/summary')
  @Auth()
  @ApiOkResponse({ description: 'Generate AI analysis of reviews' })
  generateReviewSummary(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.generateReviewSummary(ReviewDomainsEnum.LODGINGS, entityId);
  }
}

// * ----------------------------------------------------------------------------------------------------------------
// * RESTAURANT REVIEWS CONTROLLER
// * ----------------------------------------------------------------------------------------------------------------
@Controller('restaurants')
@ApiTags(SwaggerTags.Reviews)
export class RestaurantReviewsController {
  constructor(private readonly entityReviewsService: EntityReviewsService) {}

  @Post(':id/reviews')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review created successfully' })
  create(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.create({
      entityType: ReviewDomainsEnum.RESTAURANTS,
      entityId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Get(':id/reviews')
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  findAll(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.findAll({
      entityType: ReviewDomainsEnum.RESTAURANTS,
      entityId,
      status: ReviewStatusEnum.APPROVED,
    });
  }

  @Get(':id/reviews/me')
  @Auth()
  @ApiOkResponse({ description: 'User review retrieved successfully' })
  findUserReview(@Param('id', ParseUUIDPipe) entityId: string, @GetUser() user: User) {
    return this.entityReviewsService.findUserReview({
      entityType: ReviewDomainsEnum.RESTAURANTS,
      entityId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review retrieved successfully' })
  findOne(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.findOne({
      entityType: ReviewDomainsEnum.RESTAURANTS,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Patch(':id/reviews/:reviewId')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.update({
      entityType: ReviewDomainsEnum.RESTAURANTS,
      entityId,
      reviewId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Delete(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review deleted successfully' })
  remove(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.remove({
      entityType: ReviewDomainsEnum.RESTAURANTS,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/owner')
  @Auth()
  @ApiOkResponse({ description: 'Owner reviews retrieved successfully' })
  findAllForOwner(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReviewStatusEnum,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.entityReviewsService.findAllForOwner({
      entityType: ReviewDomainsEnum.RESTAURANTS,
      entityId,
      userId: user.id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
      sortBy,
    });
  }

  // Charts & Analytics Endpoints
  @Get(':id/reviews/analytics/distribution')
  @ApiOkResponse({ description: 'Reviews distribution by rating' })
  getReviewsDistribution(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByRating(ReviewDomainsEnum.RESTAURANTS, entityId);
  }

  @Get(':id/reviews/analytics/by-year')
  @ApiOkResponse({ description: 'Reviews count by year' })
  getReviewsByYear(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByYear(ReviewDomainsEnum.RESTAURANTS, entityId);
  }

  @Get(':id/reviews/analytics/by-month')
  @ApiOkResponse({ description: 'Reviews count by month (current year)' })
  getReviewsByMonth(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByMonth(ReviewDomainsEnum.RESTAURANTS, entityId);
  }

  @Get(':id/reviews/analytics/trend')
  @ApiOkResponse({ description: 'Rating trend over time' })
  getRatingTrend(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsRatingTrend(ReviewDomainsEnum.RESTAURANTS, entityId);
  }

  @Get(':id/reviews/analytics/metrics')
  @ApiOkResponse({ description: 'Aggregate metrics for reviews' })
  getReviewsMetrics(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsMetrics(ReviewDomainsEnum.RESTAURANTS, entityId);
  }

  @Post(':id/reviews/analytics/summary')
  @Auth()
  @ApiOkResponse({ description: 'Generate AI analysis of reviews' })
  generateReviewSummary(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.generateReviewSummary(ReviewDomainsEnum.RESTAURANTS, entityId);
  }
}

// * ----------------------------------------------------------------------------------------------------------------
// * COMMERCE REVIEWS CONTROLLER
// * ----------------------------------------------------------------------------------------------------------------
@Controller('commerce')
@ApiTags(SwaggerTags.Reviews)
export class CommerceReviewsController {
  constructor(private readonly entityReviewsService: EntityReviewsService) {}

  @Post(':id/reviews')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review created successfully' })
  create(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.create({
      entityType: ReviewDomainsEnum.COMMERCE,
      entityId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Get(':id/reviews')
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  findAll(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.findAll({
      entityType: ReviewDomainsEnum.COMMERCE,
      entityId,
      status: ReviewStatusEnum.APPROVED,
    });
  }

  @Get(':id/reviews/me')
  @Auth()
  @ApiOkResponse({ description: 'User review retrieved successfully' })
  findUserReview(@Param('id', ParseUUIDPipe) entityId: string, @GetUser() user: User) {
    return this.entityReviewsService.findUserReview({
      entityType: ReviewDomainsEnum.COMMERCE,
      entityId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review retrieved successfully' })
  findOne(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.findOne({
      entityType: ReviewDomainsEnum.COMMERCE,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Patch(':id/reviews/:reviewId')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.update({
      entityType: ReviewDomainsEnum.COMMERCE,
      entityId,
      reviewId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Delete(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review deleted successfully' })
  remove(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.remove({
      entityType: ReviewDomainsEnum.COMMERCE,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/owner')
  @Auth()
  @ApiOkResponse({ description: 'Owner reviews retrieved successfully' })
  findAllForOwner(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReviewStatusEnum,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.entityReviewsService.findAllForOwner({
      entityType: ReviewDomainsEnum.COMMERCE,
      entityId,
      userId: user.id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
      sortBy,
    });
  }

  // Charts & Analytics Endpoints
  @Get(':id/reviews/analytics/distribution')
  @ApiOkResponse({ description: 'Reviews distribution by rating' })
  getReviewsDistribution(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByRating(ReviewDomainsEnum.COMMERCE, entityId);
  }

  @Get(':id/reviews/analytics/by-year')
  @ApiOkResponse({ description: 'Reviews count by year' })
  getReviewsByYear(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByYear(ReviewDomainsEnum.COMMERCE, entityId);
  }

  @Get(':id/reviews/analytics/by-month')
  @ApiOkResponse({ description: 'Reviews count by month (current year)' })
  getReviewsByMonth(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsCountByMonth(ReviewDomainsEnum.COMMERCE, entityId);
  }

  @Get(':id/reviews/analytics/trend')
  @ApiOkResponse({ description: 'Rating trend over time' })
  getRatingTrend(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsRatingTrend(ReviewDomainsEnum.COMMERCE, entityId);
  }

  @Get(':id/reviews/analytics/metrics')
  @ApiOkResponse({ description: 'Aggregate metrics for reviews' })
  getReviewsMetrics(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.getReviewsMetrics(ReviewDomainsEnum.COMMERCE, entityId);
  }

  @Post(':id/reviews/analytics/summary')
  @Auth()
  @ApiOkResponse({ description: 'Generate AI analysis of reviews' })
  generateReviewSummary(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.generateReviewSummary(ReviewDomainsEnum.COMMERCE, entityId);
  }
}

// * ----------------------------------------------------------------------------------------------------------------
// * EXPERIENCE REVIEWS CONTROLLER
// * ----------------------------------------------------------------------------------------------------------------
@Controller('experiences')
@ApiTags(SwaggerTags.Reviews)
export class ExperienceReviewsController {
  constructor(private readonly entityReviewsService: EntityReviewsService) {}

  @Post(':id/reviews')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review created successfully' })
  create(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.create({
      entityType: ReviewDomainsEnum.EXPERIENCES,
      entityId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Get(':id/reviews')
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  findAll(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.findAll({
      entityType: ReviewDomainsEnum.EXPERIENCES,
      entityId,
      status: ReviewStatusEnum.APPROVED,
    });
  }

  @Get(':id/reviews/me')
  @Auth()
  @ApiOkResponse({ description: 'User review retrieved successfully' })
  findUserReview(@Param('id', ParseUUIDPipe) entityId: string, @GetUser() user: User) {
    return this.entityReviewsService.findUserReview({
      entityType: ReviewDomainsEnum.EXPERIENCES,
      entityId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review retrieved successfully' })
  findOne(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.findOne({
      entityType: ReviewDomainsEnum.EXPERIENCES,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Patch(':id/reviews/:reviewId')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.update({
      entityType: ReviewDomainsEnum.EXPERIENCES,
      entityId,
      reviewId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Delete(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review deleted successfully' })
  remove(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.remove({
      entityType: ReviewDomainsEnum.EXPERIENCES,
      entityId,
      reviewId,
      userId: user.id,
    });
  }
}

// * ----------------------------------------------------------------------------------------------------------------
// * TRANSPORT REVIEWS CONTROLLER
// * ----------------------------------------------------------------------------------------------------------------
@Controller('transport')
@ApiTags(SwaggerTags.Reviews)
export class TransportReviewsController {
  constructor(private readonly entityReviewsService: EntityReviewsService) {}

  @Post(':id/reviews')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review created successfully' })
  create(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.create({
      entityType: ReviewDomainsEnum.TRANSPORT,
      entityId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Get(':id/reviews')
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  findAll(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.findAll({
      entityType: ReviewDomainsEnum.TRANSPORT,
      entityId,
      status: ReviewStatusEnum.APPROVED,
    });
  }

  @Get(':id/reviews/me')
  @Auth()
  @ApiOkResponse({ description: 'User review retrieved successfully' })
  findUserReview(@Param('id', ParseUUIDPipe) entityId: string, @GetUser() user: User) {
    return this.entityReviewsService.findUserReview({
      entityType: ReviewDomainsEnum.TRANSPORT,
      entityId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review retrieved successfully' })
  findOne(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.findOne({
      entityType: ReviewDomainsEnum.TRANSPORT,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Patch(':id/reviews/:reviewId')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.update({
      entityType: ReviewDomainsEnum.TRANSPORT,
      entityId,
      reviewId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Delete(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review deleted successfully' })
  remove(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.remove({
      entityType: ReviewDomainsEnum.TRANSPORT,
      entityId,
      reviewId,
      userId: user.id,
    });
  }
}

// * ----------------------------------------------------------------------------------------------------------------
// * GUIDE REVIEWS CONTROLLER
// * ----------------------------------------------------------------------------------------------------------------
@Controller('guides')
@ApiTags(SwaggerTags.Reviews)
export class GuideReviewsController {
  constructor(private readonly entityReviewsService: EntityReviewsService) {}

  @Post(':id/reviews')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review created successfully' })
  create(
    @Param('id', ParseUUIDPipe) entityId: string,
    @GetUser() user: User,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.create({
      entityType: ReviewDomainsEnum.GUIDES,
      entityId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Get(':id/reviews')
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  findAll(@Param('id', ParseUUIDPipe) entityId: string) {
    return this.entityReviewsService.findAll({
      entityType: ReviewDomainsEnum.GUIDES,
      entityId,
      status: ReviewStatusEnum.APPROVED,
    });
  }

  @Get(':id/reviews/me')
  @Auth()
  @ApiOkResponse({ description: 'User review retrieved successfully' })
  findUserReview(@Param('id', ParseUUIDPipe) entityId: string, @GetUser() user: User) {
    return this.entityReviewsService.findUserReview({
      entityType: ReviewDomainsEnum.GUIDES,
      entityId,
      userId: user.id,
    });
  }

  @Get(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review retrieved successfully' })
  findOne(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.findOne({
      entityType: ReviewDomainsEnum.GUIDES,
      entityId,
      reviewId,
      userId: user.id,
    });
  }

  @Patch(':id/reviews/:reviewId')
  @Auth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Review updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
    @Body() dto: UpdateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.entityReviewsService.update({
      entityType: ReviewDomainsEnum.GUIDES,
      entityId,
      reviewId,
      user,
      reviewDto: { ...dto, images },
    });
  }

  @Delete(':id/reviews/:reviewId')
  @Auth()
  @ApiOkResponse({ description: 'Review deleted successfully' })
  remove(
    @Param('id', ParseUUIDPipe) entityId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @GetUser() user: User,
  ) {
    return this.entityReviewsService.remove({
      entityType: ReviewDomainsEnum.GUIDES,
      entityId,
      reviewId,
      userId: user.id,
    });
  }
}
