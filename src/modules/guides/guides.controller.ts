import { Controller, Get, Post, Patch, Param, Delete, Body, ParseUUIDPipe } from '@nestjs/common';
import { SwaggerTags } from 'src/config';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { GuidesService } from './guides.service';
import { GuideDto } from './dto/guide.dto';
import { GuidesFilters } from './decorators/guides-filters.decorator';
import { GuidesFiltersDto } from './dto/guides-filters.dto';
import { GuideListQueryDocsGroup } from './decorators/guides-list-query-docs-group.decorator';
import { OptionalAuth } from '../auth/decorators';

@Controller('guides')
@ApiTags(SwaggerTags.Guides)
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE TRANSPORT
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
  // * GET GUIDE BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Guide Detail', type: GuideDto })
  findOne(@Param('identifier') identifier: string) {
    return this.guidesService.findOne({ identifier });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE GUIDE
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'The UUID of the guide' })
  @ApiOkResponse({ description: 'The guide has been successfully updated.', type: GuideDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateGuideDto: UpdateGuideDto) {
    return this.guidesService.update(id, updateGuideDto);
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
}
