import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { HomeDataDto } from './dto';
import { TenantId } from '../tenant/tenant.decorator';

@Controller('home/carousels/modules')
@ApiTags('Home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({
    summary: 'Get random home data (places, lodgings, restaurants, experiences) scoped to the current tenant (town)',
  })
  @ApiOkResponse({
    description: 'Random home data retrieved successfully',
    type: HomeDataDto,
  })
  getHomeData(@TenantId() tenantId: string | null): Promise<HomeDataDto> {
    return this.homeService.getHomeData(tenantId);
  }
}
