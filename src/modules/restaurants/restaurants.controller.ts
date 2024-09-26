import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';

import { SwaggerTags } from 'src/config';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
@ApiTags(SwaggerTags.Restaurants)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.restaurantsService.findOne(slug);
  }
}
