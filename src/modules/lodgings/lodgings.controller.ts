import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Post,
  UseInterceptors,
  Delete,
  ParseUUIDPipe,
  UploadedFiles,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from 'src/config';
import { OptionalAuth } from '../auth/decorators';

import { LodgingsService } from './lodgings.service';
import { LodgingFilters, LodgingListQueryParamsDocs } from './decorators';
import {
  CreateLodgingDto,
  LodgingFiltersDto,
  LodgingFullDto,
  LodgingIndexDto,
  UpdateLodgingDto,
  UploadLodgingImagesDto,
} from './dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ContentTypes } from '../common/constants';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { LodgingVectorDto } from './dto/lodging-vector.dto';

@Controller('lodgings')
@ApiTags(SwaggerTags.Lodgings)
export class LodgingsController {
  constructor(private readonly lodgingsService: LodgingsService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL LODGINGS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @LodgingListQueryParamsDocs()
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging List', type: [LodgingIndexDto] })
  findAll(@LodgingFilters() filters: LodgingFiltersDto) {
    return this.lodgingsService.findAll({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PUBLIC LODGINGS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('public')
  @ApiOkResponse({ description: 'Lodging List', type: [LodgingIndexDto] })
  findPublicLodgings(@LodgingFilters() filters: LodgingFiltersDto) {
    return this.lodgingsService.findPublicLodgings({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PUBLIC LODGINGS WITH FULL INFO
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('public/full-info')
  @ApiOkResponse({ description: 'Lodging List', type: [LodgingVectorDto] })
  findPublicFullInfoLodgings(@LodgingFilters() filters: LodgingFiltersDto) {
    return this.lodgingsService.findPublicFullInfoLodgings({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET LODGING BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Detail', type: LodgingFullDto })
  findOne(@Param('identifier') identifier: string) {
    return this.lodgingsService.findOne({ identifier });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET LODGING BY SLUG
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('slug/:slug')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Detail', type: LodgingFullDto })
  findOneBySlug(@Param('slug') slug: string) {
    return this.lodgingsService.findOneBySlug({ slug });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE LODGING
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Created', type: LodgingFullDto })
  create(@Body() createLodgingDto: CreateLodgingDto) {
    return this.lodgingsService.create(createLodgingDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE LODGING
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Updated', type: LodgingFullDto })
  update(@Param('identifier') identifier: string, @Body() updateLodgingDto: UpdateLodgingDto) {
    return this.lodgingsService.update(identifier, updateLodgingDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE USER IN LODGING
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/users/:userId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'User Updated in Lodging', type: LodgingFullDto })
  @ApiBadRequestResponse({ description: 'The user cannot be updated in the lodging' })
  updateUser(@Param('identifier') identifier: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.lodgingsService.updateUser(identifier, userId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE LODGING
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Deleted' })
  deleteLodging(@Param('identifier') identifier: string) {
    return this.lodgingsService.delete(identifier);
  }

  @Patch(':identifier/visibility')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Visibility Updated', type: LodgingFullDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateVisibility(@Param('identifier') identifier: string, @Body() body: { isPublic: boolean }) {
    return this.lodgingsService.updateVisibility(identifier, body.isPublic);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE LODGING GOOGLE MAPS REVIEWS VISIBILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/show-google-maps-reviews')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Google Maps Reviews Visibility Updated', type: LodgingFullDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateShowGoogleMapsReviews(
    @Param('identifier') identifier: string,
    @Body() body: { showGoogleMapsReviews: boolean },
  ) {
    return this.lodgingsService.updateShowGoogleMapsReviews(identifier, body.showGoogleMapsReviews);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPLOAD LODGING IMAGES
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
        mediaFormat: {
          type: 'string',
          enum: ['image', 'video'],
          default: 'image',
        },
        videoUrl: {
          type: 'string',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Images uploaded successfully',
    type: LodgingFullDto,
  })
  @ApiBadRequestResponse({ description: 'The images cannot be uploaded' })
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('identifier') identifier: string,
    @Body() uploadLodgingImagesDto: UploadLodgingImagesDto,
  ) {
    return this.lodgingsService.uploadImages(
      identifier,
      files,
      uploadLodgingImagesDto.mediaFormat,
      uploadLodgingImagesDto.videoUrl,
    );
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET LODGING IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier/images')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Images List' })
  getImages(@Param('identifier') identifier: string) {
    return this.lodgingsService.getImages(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE LODGING IMAGE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier/images/:imageId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Image Deleted' })
  @ApiBadRequestResponse({ description: 'The image cannot be deleted' })
  deleteImage(@Param('identifier') identifier: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.lodgingsService.deleteImage(identifier, imageId);
  }

  @Patch(':identifier/images/reorder')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Images Reordered' })
  @ApiBadRequestResponse({ description: 'The images cannot be reordered' })
  reorderImages(@Param('identifier') identifier: string, @Body() reorderImagesDto: ReorderImagesDto) {
    return this.lodgingsService.reorderImages(identifier, reorderImagesDto);
  }
}
