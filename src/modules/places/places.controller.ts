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
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PlaceDetailDto, PlaceDto } from './dto';
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
import { ContentTypes } from '../common/constants';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';

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
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'The place has been successfully created.', type: PlaceDto })
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placesService.create({ ...createPlaceDto });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PLACES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @PlaceListQueryDocsGroup()
  @OptionalAuth()
  @ApiOkResponse({ description: 'The places have been successfully retrieved.', type: [PlaceDto] })
  findAll(@PlaceFilters() filters: PlaceFiltersDto, @GetUser() user: User | null) {
    return this.placesService.findAll(filters, user);
  }

  @Get('public')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Place List', type: [PlaceDto] })
  findPublicPlaces(@PlaceFilters() filters: PlaceFiltersDto, @GetUser() user: User | null) {
    return this.placesService.findPublicPlaces(filters, user);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET PLACE BY ID
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @OptionalAuth()
  @ApiParam({ name: 'id', type: 'string', description: 'The UUID of the place or slug' })
  @ApiOkResponse({ description: 'The place has been successfully retrieved.', type: PlaceDetailDto })
  findOne(@Param('id') id: string, @GetUser() user: User | null) {
    return this.placesService.findOne(id, user);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE PLACE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placesService.update(id, updatePlaceDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE PLACE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a place', deprecated: true })
  remove(@Param('id') id: string) {
    return this.placesService.delete(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * PLACE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a new image to a place', deprecated: true })
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
  @ApiOperation({ summary: 'Remove a place image', deprecated: true })
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    console.log(id, imageId);
    throw new NotImplementedException('This action removes a place image');
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * PLACE REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  @Post(':id/reviews')
  @Auth()
  @ApiOperation({ summary: 'Create a new review for a place' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @UseInterceptors(FilesInterceptor('images'))
  createReview(
    @Param('id') id: string,
    @Body() reviewDto: CreateReviewDto,
    @GetUser() user: User,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ) {
    reviewDto.images = images;
    return this.placeReviewsService.create({ placeId: id, user, reviewDto });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET PLACE REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews for a place' })
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
  @UseInterceptors(FilesInterceptor('images'))
  updateReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Body() review: UpdateReviewDto,
    @GetUser() user: User,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ) {
    review.images = images;
    return this.placeReviewsService.update({ reviewId, user, placeId: id, reviewDto: review });
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

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE PLACE VISIBILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/visibility')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Visibility Updated', type: PlaceDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateVisibility(@Param('identifier') identifier: string, @Body() body: { isPublic: boolean }) {
    return this.placesService.updateVisibility(identifier, body.isPublic);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPLOAD PLACE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Post(':identifier/upload-images')
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
    type: PlaceDto,
  })
  @ApiBadRequestResponse({ description: 'The images cannot be uploaded' })
  uploadImages(@UploadedFiles() files: Express.Multer.File[], @Param('identifier') identifier: string) {
    return this.placesService.uploadImages(identifier, files);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET PLACE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier/images')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Place Images List' })
  getImages(@Param('identifier') identifier: string) {
    return this.placesService.getImages(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE PLACE IMAGE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier/images/:imageId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Image Deleted' })
  @ApiBadRequestResponse({ description: 'The image cannot be deleted' })
  deleteImage(@Param('identifier') identifier: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.placesService.deleteImage(identifier, imageId);
  }

  @Patch(':identifier/images/reorder')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Images Reordered' })
  @ApiBadRequestResponse({ description: 'The images cannot be reordered' })
  reorderImages(@Param('identifier') identifier: string, @Body() reorderImagesDto: ReorderImagesDto) {
    return this.placesService.reorderImages(identifier, reorderImagesDto);
  }
}
