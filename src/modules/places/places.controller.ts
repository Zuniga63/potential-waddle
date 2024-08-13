import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  NotImplementedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PlaceDto } from './dto';
import { SwaggerTags } from 'src/config';
import { PlaceFilters, PlaceListQueryDocsGroup } from './decorators';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { ImageFileValidationPipe } from '../common/pipes';
import { PlaceFiltersDto } from './dto/place-filters.dto';
import { GetUser } from '../common/decorators';
import { Auth, OptionalAuth } from '../auth/decorators';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto, UpdateReviewDto } from '../reviews/dto';
import { PlaceReviewsService } from '../reviews/services';

@Controller('places')
@ApiTags(SwaggerTags.Places)
export class PlacesController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly placeReviewsService: PlaceReviewsService,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE PLACE
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @ApiOperation({ summary: 'Create a new place' })
  @UseInterceptors(FileInterceptor('imageFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'The place has been successfully created.', type: PlaceDto })
  create(
    @Body() createPlaceDto: CreatePlaceDto,
    @UploadedFile(new ImageFileValidationPipe({ propertyName: 'imageFile' })) image: Express.Multer.File,
  ) {
    return this.placesService.create({ ...createPlaceDto, imageFile: image });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PLACES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @PlaceListQueryDocsGroup()
  @OptionalAuth()
  findAll(@PlaceFilters() filters: PlaceFiltersDto, @GetUser() user: User | null) {
    return this.placesService.findAll(filters, user);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET PLACE BY ID
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE PLACE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placesService.update(+id, updatePlaceDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE PLACE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.placesService.remove(+id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * PLACE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(new ImageFileValidationPipe({ propertyName: 'image' })) image: Express.Multer.File,
  ) {
    console.log(id, image);
    throw new NotImplementedException('This action adds a new place image');
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE PLACE IMAGE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id/image/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    console.log(id, imageId);
    throw new NotImplementedException('This action removes a place image');
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * PLACE REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  @Post(':id/reviews')
  @Auth()
  createReview(@Param('id') id: string, @Body() reviewDto: CreateReviewDto, @GetUser() user: User) {
    return this.placeReviewsService.create({ placeId: id, user, reviewDto });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET PLACE REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id/reviews')
  getReviews(@Param('id') id: string) {
    console.log(id);
    throw new NotImplementedException('This action returns all place reviews');
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET PLACE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id/reviews/:reviewId')
  @Auth()
  @ApiOperation({ summary: 'Get a review of a user for a place' })
  getReview(@Param('id') placeId: string, @Param('reviewId') reviewId: string, @GetUser() user: User) {
    return this.placeReviewsService.findOne(reviewId, user.id, placeId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE PLACE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id/reviews/:reviewId')
  @Auth()
  @ApiOperation({ summary: 'Update a review of a user for a place' })
  updateReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Body() review: UpdateReviewDto,
    @GetUser() user: User,
  ) {
    return this.placeReviewsService.update({ reviewId, userId: user.id, placeId: id, reviewDto: review });
  }
  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE PLACE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id/reviews/:reviewId')
  @Auth()
  @ApiOperation({ summary: 'Delete a review of a user for a place' })
  removeReview(@Param('id') id: string, @Param('reviewId') reviewId: string, @GetUser() user: User) {
    return this.placeReviewsService.remove({ reviewId, userId: user.id, placeId: id });
  }
}
