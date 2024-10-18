import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';

import { SwaggerTags } from 'src/config';

import { RestaurantFiltersDto } from './dto';
import { OptionalAuth } from '../auth/decorators';
import { RestaurantsService } from './restaurants.service';
import { RestaurantFilters, RestaurantListApiQueries } from './decorators';

@Controller(SwaggerTags.Restaurants)
@ApiTags(SwaggerTags.Restaurants)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @OptionalAuth()
  @RestaurantListApiQueries()
  findAll(@RestaurantFilters() filters: RestaurantFiltersDto) {
    return this.restaurantsService.findAll({ filters });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.restaurantsService.findOne(slug);
  }
}
