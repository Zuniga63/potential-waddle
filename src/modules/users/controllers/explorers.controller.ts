import { Controller, Get } from '@nestjs/common';
import { SwaggerTags } from 'src/config';
import { ApiOperation, ApiOkResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ExplorersService } from '../services/explorers.service';
import { ExplorerRankingDto } from '../dto';

@Controller(`users/explorers`)
@ApiTags(SwaggerTags.Users)
export class ExplorersController {
  constructor(private readonly explorersService: ExplorersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all explorers' })
  @ApiOkResponse({ description: 'Return all explorers', type: [ExplorerRankingDto] })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Number of explorers to return per page' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number to return' })
  @ApiQuery({ name: 'town-code', required: false, description: 'Town code to filter explorers' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Search by explorer name' })
  findAll() {
    return this.explorersService.findAllExplorersRanking();
  }
}
