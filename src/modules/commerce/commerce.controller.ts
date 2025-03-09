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

import { CommerceFiltersDto, CreateCommerceDto, UpdateCommerceDto, CommerceFullDto, CommerceIndexDto } from './dto';
import { OptionalAuth } from '../auth/decorators';
import { CommerceService } from './commerce.service';
import { CommerceFilters, CommerceListQueryParamsDocs } from './decorators';

@Controller(SwaggerTags.Commerce)
@ApiTags(SwaggerTags.Commerce)
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL COMMERCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @OptionalAuth()
  @CommerceListQueryParamsDocs()
  @ApiOkResponse({ description: 'Commerce List', type: [CommerceIndexDto] })
  findAll(@CommerceFilters() filters: CommerceFiltersDto) {
    return this.commerceService.findAll({ filters });
  }

  // ------------------------------------------------------------------------------------------------
  // Find all public commerce
  // ------------------------------------------------------------------------------------------------
  @Get('public')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce List', type: [CommerceIndexDto] })
  findPublicCommerce(@CommerceFilters() filters: CommerceFiltersDto) {
    return this.commerceService.findPublicCommerce({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET COMMERCE BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  @ApiOkResponse({ description: 'Commerce Detail', type: CommerceFullDto })
  findOne(@Param('identifier') identifier: string) {
    return this.commerceService.findOne(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET COMMERCE BY SLUG
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('slug/:slug')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce Detail', type: CommerceFullDto })
  findOneBySlug(@Param('slug') slug: string) {
    return this.commerceService.findOneBySlug({ slug });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE COMMERCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce Created', type: CommerceFullDto })
  create(@Body() createCommerceDto: CreateCommerceDto) {
    return this.commerceService.create(createCommerceDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE COMMERCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce Updated', type: CommerceFullDto })
  update(@Param('identifier') identifier: string, @Body() updateCommerceDto: UpdateCommerceDto) {
    return this.commerceService.update(identifier, updateCommerceDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE COMMERCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce Deleted' })
  deleteCommerce(@Param('identifier') identifier: string) {
    return this.commerceService.delete(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE USER IN COMMERCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/users/:userId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'User Updated in Commerce', type: CommerceFullDto })
  @ApiBadRequestResponse({ description: 'The user cannot be updated in the commerce' })
  updateUser(@Param('identifier') identifier: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.commerceService.updateUser(identifier, userId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE COMMERCE VISIBILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/visibility')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce Visibility Updated', type: CommerceFullDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateVisibility(@Param('identifier') identifier: string, @Body() body: { isPublic: boolean }) {
    return this.commerceService.updateVisibility(identifier, body.isPublic);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPLOAD COMMERCE IMAGES
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
    type: CommerceFullDto,
  })
  @ApiBadRequestResponse({ description: 'The images cannot be uploaded' })
  uploadImages(@UploadedFiles() files: Express.Multer.File[], @Param('identifier') identifier: string) {
    return this.commerceService.uploadImages(identifier, files);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET COMMERCE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier/images')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce Images List' })
  getImages(@Param('identifier') identifier: string) {
    return this.commerceService.getImages(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE COMMERCE IMAGE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier/images/:imageId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Image Deleted' })
  @ApiBadRequestResponse({ description: 'The image cannot be deleted' })
  deleteImage(@Param('identifier') identifier: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.commerceService.deleteImage(identifier, imageId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * REORDER COMMERCE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/images/reorder')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Images Reordered' })
  @ApiBadRequestResponse({ description: 'The images cannot be reordered' })
  reorderImages(@Param('identifier') identifier: string, @Body() reorderImagesDto: ReorderImagesDto) {
    return this.commerceService.reorderImages(identifier, reorderImagesDto);
  }
}
