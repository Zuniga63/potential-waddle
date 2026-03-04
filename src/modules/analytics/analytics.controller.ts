import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { AnalyticsService } from './analytics.service';
import { AnalyticsPaginationDto } from './dto/analytics-pagination.dto';
import { ApiKeyAuth } from './decorators/api-key-auth.decorator';

@ApiTags(SwaggerTags.Analytics)
@ApiKeyAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==========================================================================
  // ENTITY ENDPOINTS
  // ==========================================================================

  @Get('lodgings')
  @ApiOperation({ summary: 'Get all lodgings (flat data for BigQuery)' })
  getLodgings(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getLodgings(pagination);
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Get all restaurants (flat data for BigQuery)' })
  getRestaurants(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getRestaurants(pagination);
  }

  @Get('experiences')
  @ApiOperation({ summary: 'Get all experiences (flat data for BigQuery)' })
  getExperiences(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getExperiences(pagination);
  }

  @Get('transport')
  @ApiOperation({ summary: 'Get all transport (flat data for BigQuery)' })
  getTransport(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getTransport(pagination);
  }

  @Get('commerces')
  @ApiOperation({ summary: 'Get all commerces (flat data for BigQuery)' })
  getCommerces(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getCommerces(pagination);
  }

  @Get('guides')
  @ApiOperation({ summary: 'Get all guides (flat data for BigQuery)' })
  getGuides(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getGuides(pagination);
  }

  // ==========================================================================
  // MASTER TABLE ENDPOINTS
  // ==========================================================================

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  getCategories(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getCategories(pagination);
  }

  @Get('facilities')
  @ApiOperation({ summary: 'Get all facilities' })
  getFacilities(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getFacilities(pagination);
  }

  // ==========================================================================
  // RELATION TABLE ENDPOINTS
  // ==========================================================================

  @Get('lodging-categories')
  @ApiOperation({ summary: 'Get lodging-category relationships' })
  getLodgingCategories(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getLodgingCategories(pagination);
  }

  @Get('lodging-facilities')
  @ApiOperation({ summary: 'Get lodging-facility relationships' })
  getLodgingFacilities(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getLodgingFacilities(pagination);
  }

  @Get('restaurant-categories')
  @ApiOperation({ summary: 'Get restaurant-category relationships' })
  getRestaurantCategories(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getRestaurantCategories(pagination);
  }

  @Get('restaurant-facilities')
  @ApiOperation({ summary: 'Get restaurant-facility relationships' })
  getRestaurantFacilities(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getRestaurantFacilities(pagination);
  }

  @Get('experience-categories')
  @ApiOperation({ summary: 'Get experience-category relationships' })
  getExperienceCategories(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getExperienceCategories(pagination);
  }

  @Get('experience-facilities')
  @ApiOperation({ summary: 'Get experience-facility relationships' })
  getExperienceFacilities(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getExperienceFacilities(pagination);
  }

  @Get('transport-categories')
  @ApiOperation({ summary: 'Get transport-category relationships' })
  getTransportCategories(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getTransportCategories(pagination);
  }

  @Get('commerce-categories')
  @ApiOperation({ summary: 'Get commerce-category relationships' })
  getCommerceCategories(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getCommerceCategories(pagination);
  }

  @Get('commerce-facilities')
  @ApiOperation({ summary: 'Get commerce-facility relationships' })
  getCommerceFacilities(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getCommerceFacilities(pagination);
  }

  @Get('guide-categories')
  @ApiOperation({ summary: 'Get guide-category relationships' })
  getGuideCategories(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getGuideCategories(pagination);
  }

  @Get('guide-towns')
  @ApiOperation({ summary: 'Get guide-town relationships' })
  getGuideTowns(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getGuideTowns(pagination);
  }

  // ==========================================================================
  // MENU ENDPOINTS
  // ==========================================================================

  @Get('menus')
  @ApiOperation({ summary: 'Get all menus (flat data for BigQuery)' })
  getMenus(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getMenus(pagination);
  }

  @Get('menu-items')
  @ApiOperation({ summary: 'Get all menu items extracted from JSONB (flat data for BigQuery)' })
  getMenuItems(@Query() pagination: AnalyticsPaginationDto) {
    return this.analyticsService.getMenuItems(pagination);
  }
}
