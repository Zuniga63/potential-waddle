import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { HomeDataDto } from './dto';

@Controller('home/carousels/modules')
@ApiTags('Home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get random home data including places, lodgings, restaurants, and experiences' })
  @ApiOkResponse({
    description: 'Random home data retrieved successfully',
    type: HomeDataDto,
  })
  getHomeData(): Promise<HomeDataDto> {
    return this.homeService.getHomeData();
  }
}
