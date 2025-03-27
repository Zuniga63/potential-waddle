import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';

import { SwaggerTags } from 'src/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ContentTypes } from '../common/constants';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';

import { RestaurantFiltersDto, CreateRestaurantDto, UpdateRestaurantDto, RestaurantDto } from './dto';
import { OptionalAuth } from '../auth/decorators';
import { RestaurantsService } from './restaurants.service';
import { RestaurantFilters, RestaurantListApiQueries } from './decorators';

@Controller(SwaggerTags.Restaurants)
@ApiTags(SwaggerTags.Restaurants)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL RESTAURANTS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @OptionalAuth()
  @RestaurantListApiQueries()
  @ApiOkResponse({ description: 'Restaurant List', type: [RestaurantDto] })
  findAll(@RestaurantFilters() filters: RestaurantFiltersDto) {
    return this.restaurantsService.findAll({ filters });
  }

  @Get('public')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Restaurant List', type: [RestaurantDto] })
  findPublicRestaurants(@RestaurantFilters() filters: RestaurantFiltersDto) {
    return this.restaurantsService.findPublicRestaurants({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET RESTAURANT BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  @ApiOkResponse({ description: 'Restaurant Detail', type: RestaurantDto })
  findOne(@Param('identifier') identifier: string) {
    return this.restaurantsService.findOne(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET RESTAURANT BY SLUG
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('slug/:slug')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Restaurant Detail', type: RestaurantDto })
  findOneBySlug(@Param('slug') slug: string) {
    return this.restaurantsService.findOneBySlug({ slug });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE RESTAURANT
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @OptionalAuth()
  @ApiOkResponse({ description: 'Restaurant Created', type: RestaurantDto })
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(createRestaurantDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE RESTAURANT
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Restaurant Updated', type: RestaurantDto })
  update(@Param('identifier') identifier: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantsService.update(identifier, updateRestaurantDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE RESTAURANT
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Restaurant Deleted' })
  deleteRestaurant(@Param('identifier') identifier: string) {
    return this.restaurantsService.delete(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE USER IN RESTAURANT
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/users/:userId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'User Updated in Restaurant', type: RestaurantDto })
  @ApiBadRequestResponse({ description: 'The user cannot be updated in the restaurant' })
  updateUser(@Param('identifier') identifier: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.restaurantsService.updateUser(identifier, userId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE RESTAURANT GOOGLE MAPS REVIEWS VISIBILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/show-google-maps-reviews')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Restaurant Google Maps Reviews Visibility Updated', type: RestaurantDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateShowGoogleMapsReviews(
    @Param('identifier') identifier: string,
    @Body() body: { showGoogleMapsReviews: boolean },
  ) {
    return this.restaurantsService.updateShowGoogleMapsReviews(identifier, body.showGoogleMapsReviews);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPLOAD RESTAURANT IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Post(':identifier/upload-images')
  @OptionalAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes(ContentTypes.MULTIPART_FORM_DATA)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Images uploaded successfully',
    type: RestaurantDto,
  })
  @ApiBadRequestResponse({ description: 'The images cannot be uploaded' })
  uploadImages(@UploadedFiles() files: Express.Multer.File[], @Param('identifier') identifier: string) {
    return this.restaurantsService.uploadImages(identifier, files);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET RESTAURANT IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier/images')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Restaurant Images List' })
  getImages(@Param('identifier') identifier: string) {
    return this.restaurantsService.getImages(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE RESTAURANT IMAGE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier/images/:imageId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Image Deleted' })
  @ApiBadRequestResponse({ description: 'The image cannot be deleted' })
  deleteImage(@Param('identifier') identifier: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.restaurantsService.deleteImage(identifier, imageId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * REORDER RESTAURANT IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/images/reorder')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Images Reordered' })
  @ApiBadRequestResponse({ description: 'The images cannot be reordered' })
  reorderImages(@Param('identifier') identifier: string, @Body() reorderImagesDto: ReorderImagesDto) {
    return this.restaurantsService.reorderImages(identifier, reorderImagesDto);
  }
}
