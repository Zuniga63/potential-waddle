import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { LodgingIndexDto } from './dto';
import { SwaggerTags } from 'src/config';
import { OptionalAuth } from '../auth/decorators';
import { LodgingsService } from './lodgings.service';
import { LodgingListQueryParamsDocs } from './decorators';

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
  findAll() {
    return this.lodgingsService.findAll();
  }
}
