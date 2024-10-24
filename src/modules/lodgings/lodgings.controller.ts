import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from 'src/config';
import { OptionalAuth } from '../auth/decorators';

import { LodgingsService } from './lodgings.service';
import { LodgingFilters, LodgingListQueryParamsDocs } from './decorators';
import { LodgingFiltersDto, LodgingFullDto, LodgingIndexDto } from './dto';

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
  // * GET LODGING BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Lodging Detail', type: LodgingFullDto })
  findOne(@Param('identifier') identifier: string) {
    return this.lodgingsService.findOne({ identifier });
  }
}
