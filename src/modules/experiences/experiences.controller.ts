import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
} from '@nestjs/common';

import { SwaggerTags } from 'src/config';
import { OptionalAuth } from '../auth/decorators';
import { GetUser } from '../common/decorators';
import { User } from '../users/entities';

import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto, ExperienceDto, ExperienceFiltersDto, UpdateExperienceDto } from './dto';
import { ExperienceFilters, ExperienceListApiQueries } from './decorators';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ContentTypes } from '../common/constants';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { ExperienceVectorDto } from './dto/experience-vector.dto';

@Controller(SwaggerTags.Experiences)
@ApiTags(SwaggerTags.Experiences)
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL EXPERIENCES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @OptionalAuth()
  @ExperienceListApiQueries()
  @ApiOkResponse({ description: 'Experience List', type: [CreateExperienceDto] })
  findAll(@ExperienceFilters() filters: ExperienceFiltersDto) {
    return this.experiencesService.findAll({ filters });
  }

  // ------------------------------------------------------------------------------------------------
  // GET ALL PUBLIC EXPERIENCES
  // ------------------------------------------------------------------------------------------------
  @Get('public')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience List', type: [CreateExperienceDto] })
  findPublicExperiences(@ExperienceFilters() filters: ExperienceFiltersDto, @GetUser() user?: User) {
    return this.experiencesService.findPublicExperiences({ filters, user });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PUBLIC EXPERIENCES WITH FULL INFO
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('public/full-info')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience List', type: [ExperienceVectorDto] })
  findPublicFullInfoExperiences(@ExperienceFilters() filters: ExperienceFiltersDto) {
    return this.experiencesService.findPublicFullInfoExperiences({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET EXPERIENCE BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  findOne(@Param('identifier') id: string) {
    return this.experiencesService.findOne(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET EXPERIENCE BY SLUG
  // * ----------------------------------------------------------------------------------------------------------------
  @Get('slug/:slug')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience Detail', type: CreateExperienceDto })
  findOneBySlug(@Param('slug') slug: string, @GetUser() user?: User) {
    return this.experiencesService.findOneBySlug({ slug, user });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE EXPERIENCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience Created', type: CreateExperienceDto })
  create(@Body() createExperienceDto: CreateExperienceDto) {
    return this.experiencesService.create(createExperienceDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE EXPERIENCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience Updated', type: CreateExperienceDto })
  update(@Param('identifier') identifier: string, @Body() updateExperienceDto: UpdateExperienceDto) {
    return this.experiencesService.update(identifier, updateExperienceDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE GUIDE IN EXPERIENCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/guides/:guideId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Guide Updated in Experience', type: ExperienceDto })
  @ApiBadRequestResponse({ description: 'The guide cannot be updated in the experience' })
  updateGuide(@Param('identifier') identifier: string, @Param('guideId', ParseUUIDPipe) guideId: string) {
    return this.experiencesService.updateGuide(identifier, guideId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE EXPERIENCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience Deleted' })
  deleteExperience(@Param('identifier') identifier: string) {
    return this.experiencesService.delete(identifier);
  }

  @Patch(':identifier/visibility')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience Visibility Updated', type: ExperienceDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateVisibility(@Param('identifier') identifier: string, @Body() body: { isPublic: boolean }) {
    return this.experiencesService.updateVisibility(identifier, body.isPublic);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPLOAD EXPERIENCE IMAGE
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
    type: ExperienceDto,
  })
  @ApiBadRequestResponse({ description: 'The images cannot be uploaded' })
  uploadImages(@UploadedFiles() files: Express.Multer.File[], @Param('identifier') identifier: string) {
    return this.experiencesService.uploadImages(identifier, files);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET EXPERIENCE IMAGES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier/images')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Experience Images List' })
  getImages(@Param('identifier') identifier: string) {
    return this.experiencesService.getImages(identifier);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE EXPERIENCE IMAGE
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':identifier/images/:imageId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Image Deleted' })
  @ApiBadRequestResponse({ description: 'The image cannot be deleted' })
  deleteImage(@Param('identifier') identifier: string, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.experiencesService.deleteImage(identifier, imageId);
  }

  @Patch(':identifier/images/reorder')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Images Reordered' })
  @ApiBadRequestResponse({ description: 'The images cannot be reordered' })
  reorderImages(@Param('identifier') identifier: string, @Body() reorderImagesDto: ReorderImagesDto) {
    return this.experiencesService.reorderImages(identifier, reorderImagesDto);
  }
}
