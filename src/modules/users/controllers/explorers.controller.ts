import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { SwaggerTags } from 'src/config';
import { ApiOperation, ApiOkResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ExplorersService } from '../services/explorers.service';
import { UserExplorerDto, UserExplorerPlaceDto } from '../dto';

@Controller(`users/explorers`)
@ApiTags(SwaggerTags.Users)
export class ExplorersController {
  constructor(private readonly explorersService: ExplorersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all explorers' })
  @ApiOkResponse({ description: 'Return all explorers', type: [UserExplorerDto] })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Number of explorers to return per page' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number to return' })
  @ApiQuery({ name: 'town-code', required: false, description: 'Town code to filter explorers' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Search by explorer name' })
  findAll(@Query('search') search?: string) {
    return this.explorersService.findAllExplorersRanking({ search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one explorer' })
  @ApiOkResponse({ description: 'Return one explorer', type: UserExplorerDto })
  @ApiParam({ name: 'id', type: String, description: 'Explorer UUID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.explorersService.findOneExplorer(id);
  }

  @Get(':id/places')
  @ApiOperation({ summary: 'Get all places visited by an explorer' })
  @ApiOkResponse({ description: 'Return all places visited by an explorer', type: [UserExplorerPlaceDto] })
  @ApiParam({ name: 'id', type: String, description: 'Explorer UUID' })
  findPlaces(@Param('id', ParseUUIDPipe) id: string) {
    return this.explorersService.findPlacesVisitedByExplorer(id);
  }
}
