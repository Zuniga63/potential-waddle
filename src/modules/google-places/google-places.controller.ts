import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GooglePlacesService } from './google-places.service';
import { SwaggerTags } from 'src/config';
import { RemoveGooglePlaceIdDto } from './dto/remove-google-place-id.dto';
import { GoogleReviewsListQueryDocsGroup } from './decorators/google-reviews-list-query-docs-group.decorator';
import { GoogleReviewsFilters } from './decorators/google-reviews-filters.decorator';
import { GoogleReviewsFiltersDto } from './dto/google-reviews-filters.dto';
import { GoogleReviewSummaryRequestDto } from './dto/google-review-summary-request.dto';

@Controller('google-places')
@ApiTags(SwaggerTags.GooglePlaces)
export class GooglePlacesController {
  constructor(private readonly googlePlacesService: GooglePlacesService) {}

  @Post('update-all-lodgings')
  @ApiOkResponse({
    description: 'Todos los lugares actualizados correctamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Todos los lugares actualizados correctamente' },
      },
    },
  })
  updateAllPlaces() {
    return this.googlePlacesService.updateAllLodgings();
  }

  @Post('update-all-commerces')
  @ApiOkResponse({
    description: 'Todos los lugares actualizados correctamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Todos los lugares actualizados correctamente' },
      },
    },
  })
  updateAllCommerces() {
    return this.googlePlacesService.updateAllCommerces();
  }

  @Post('update-all-restaurants')
  @ApiOkResponse({
    description: 'Todos los lugares actualizados correctamente',
    schema: {
      type: 'object',
    },
  })
  updateAllRestaurants() {
    return this.googlePlacesService.updateAllRestaurants();
  }

  @Patch('remove-google-place-id')
  @ApiOkResponse({
    description: 'Google Place ID removed correctly',
  })
  removeGooglePlaceId(@Body() body: RemoveGooglePlaceIdDto) {
    return this.googlePlacesService.removeGooglePlaceId(body.placeId, body.model);
  }

  @Get('get-all-reviews/:entityId/:entityType')
  @ApiOkResponse({
    description: 'All reviews retrieved successfully',
  })
  getAllReviews(@Param('entityId') entityId: string, @Param('entityType') entityType: string) {
    return this.googlePlacesService.fetchReviewsFromApify(entityId, entityType);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL GOOGLE REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('reviews/:entityId/:entityType')
  @GoogleReviewsListQueryDocsGroup()
  findAll(
    @Param('entityId') entityId: string,
    @Param('entityType') entityType: string,
    @GoogleReviewsFilters() filters: GoogleReviewsFiltersDto,
  ) {
    return this.googlePlacesService.getAllReviews({ filters, entityId, entityType });
  }

  @Delete('delete-all-reviews/:entityId/:entityType')
  @ApiOkResponse({
    description: 'All reviews deleted successfully',
  })
  deleteAllReviews(@Param('entityId') entityId: string, @Param('entityType') entityType: string) {
    return this.googlePlacesService.deleteAllReviewsforEntity(entityId, entityType);
  }

  @Post('review-summary')
  @ApiOkResponse({
    description: 'Review summary retrieved successfully',
  })
  reviewSummary(@Body() body: GoogleReviewSummaryRequestDto) {
    return this.googlePlacesService.reviewSummary(
      body.message,
      body.entityId,
      body.entityType as 'lodging' | 'restaurant' | 'commerce',
      body.type as 'general' | 'specific',
    );
  }

  @Get('last-review-summary/:entityId/:entityType')
  @ApiOkResponse({
    description: 'Last review summary retrieved successfully',
  })
  getReviewsSummary(@Param('entityId') entityId: string, @Param('entityType') entityType: string) {
    return this.googlePlacesService.getReviewsSummary(entityId, entityType as 'lodging' | 'restaurant');
  }

  @Get('reviews-for-chart/:entityId/:entityType')
  @ApiOkResponse({
    description: 'Reviews for chart retrieved successfully.',
  })
  getReviewsforChart(@Param('entityId') entityId: string, @Param('entityType') entityType: string) {
    return this.googlePlacesService.getReviewsCountByRating(entityId, entityType as 'lodging' | 'restaurant');
  }

  @Get('reviews-for-chart-by-year/:entityId/:entityType')
  @ApiOkResponse({
    description: 'Reviews for chart by year retrieved successfully.',
  })
  getReviewsforChartByYear(@Param('entityId') entityId: string, @Param('entityType') entityType: string) {
    return this.googlePlacesService.getReviewsCountByYear(entityId, entityType as 'lodging' | 'restaurant');
  }
}
