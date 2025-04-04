import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { SwaggerTags } from 'src/config';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBody,
  ApiBadRequestResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { GuidesService } from './guides.service';
import { GuideDto } from './dto/guide.dto';
import { GuidesFilters } from './decorators/guides-filters.decorator';
import { GuidesFiltersDto } from './dto/guides-filters.dto';
import { GuideListQueryDocsGroup } from './decorators/guides-list-query-docs-group.decorator';
import { OptionalAuth } from '../auth/decorators';
import { ContentTypes } from '../common/constants/content-types';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('guides')
@ApiTags(SwaggerTags.Guides)
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE GUIDE
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @ApiOperation({ summary: 'Create a new guide' })
  @ApiOkResponse({ description: 'The guide has been successfully created.', type: GuideDto })
  create(@Body() createGuideDto: CreateGuideDto) {
    return this.guidesService.create(createGuideDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL GUIDES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @GuideListQueryDocsGroup()
  findAll(@GuidesFilters() filters: GuidesFiltersDto) {
    return this.guidesService.findAll({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PUBLIC GUIDES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('public')
  @GuideListQueryDocsGroup()
  findPublicGuides(@GuidesFilters() filters: GuidesFiltersDto) {
    return this.guidesService.findPublicGuides({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PUBLIC GUIDES WITH FULL INFO
  @Get('public/full-info')
  @GuideListQueryDocsGroup()
  findPublicFullInfoGuides() {
    return this.guidesService.findPublicFullInfoGuides();
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET GUIDE BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Guide Detail', type: GuideDto })
  findOne(@Param('identifier') identifier: string) {
    return this.guidesService.findOne({ identifier });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET GUIDE BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('public/:id')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Guide Detail', type: GuideDto })
  findOneById(@Param('id') id: string) {
    return this.guidesService.findOneById(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE GUIDE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':slug')
  @ApiParam({ name: 'slug', type: 'string', description: 'The slug of the guide' })
  @ApiOkResponse({ description: 'The guide has been successfully updated.', type: GuideDto })
  update(@Param('slug') slug: string, @Body() updateGuideDto: UpdateGuideDto) {
    return this.guidesService.update(slug, updateGuideDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE GUIDE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a guide' })
  remove(@Param('id') id: string) {
    return this.guidesService.remove(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE GUIDE AVAILABILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id/availability')
  @ApiOperation({ summary: 'Update guide availability status' })
  @ApiParam({ name: 'id', type: 'string', description: 'The UUID of the guide' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isAvailable: { type: 'boolean' },
      },
    },
  })
  @ApiOkResponse({ description: 'The guide availability has been successfully updated.', type: GuideDto })
  updateAvailability(@Param('id', ParseUUIDPipe) id: string, @Body('isAvailable') isAvailable: boolean) {
    return this.guidesService.updateAvailability(id, isAvailable);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPLOAD LODGING IMAGE
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
    type: GuideDto,
  })
  @ApiBadRequestResponse({ description: 'The images cannot be uploaded' })
  uploadImages(@UploadedFiles() files: Express.Multer.File[], @Param('identifier') identifier: string) {
    return this.guidesService.uploadImages(identifier, files);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET LODGING IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier/images')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Images List' })
  getImages(@Param('identifier') identifier: string) {
    return this.guidesService.getImages(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE LODGING IMAGE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier/images/:imageId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Image Deleted' })
  @ApiBadRequestResponse({ description: 'The image cannot be deleted' })
  deleteImage(@Param('identifier') identifier: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.guidesService.deleteImage(identifier, imageId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * REORDER GUIDE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/images/reorder')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Images Reordered' })
  @ApiBadRequestResponse({ description: 'The images cannot be reordered' })
  reorderImages(@Param('identifier') identifier: string, @Body() reorderImagesDto: ReorderImagesDto) {
    return this.guidesService.reorderImages(identifier, reorderImagesDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE USER IN GUIDE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/users/:userId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'User Updated in Guide', type: GuideDto })
  @ApiBadRequestResponse({ description: 'The user cannot be updated in the guide' })
  updateUser(@Param('identifier') identifier: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.guidesService.updateUser(identifier, userId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE GUIDE VISIBILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/visibility')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Guide Visibility Updated', type: GuideDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateVisibility(@Param('identifier') identifier: string, @Body() body: { isPublic: boolean }) {
    return this.guidesService.updateVisibility(identifier, body.isPublic);
  }
}
