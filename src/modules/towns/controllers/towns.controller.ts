import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { TownsService } from '../services';
import { CreateTownDto } from '../dto/create-town.dto';
import { UpdateTownDto } from '../dto/update-town.dto';
import { AdminTownsFiltersDto } from '../dto/admin-towns-filters.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/modules/common/decorators/get-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@Controller('towns')
@ApiTags(SwaggerTags.Town)
export class TownsController {
  constructor(private readonly townsService: TownsService) {}

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated towns list (Admin only)' })
  async findAllAdmin(@Query() filters: AdminTownsFiltersDto, @GetUser() user: User) {
    if (!user.isSuperUser) {
      throw new ForbiddenException('Only super users can access this endpoint');
    }
    return this.townsService.findAllPaginated(filters);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create town (Admin only)' })
  async createAdmin(@Body() createTownDto: CreateTownDto, @GetUser() user: User) {
    if (!user.isSuperUser) {
      throw new ForbiddenException('Only super users can access this endpoint');
    }
    return this.townsService.create(createTownDto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update town (Admin only)' })
  async updateAdmin(@Param('id') id: string, @Body() updateTownDto: UpdateTownDto, @GetUser() user: User) {
    if (!user.isSuperUser) {
      throw new ForbiddenException('Only super users can access this endpoint');
    }
    return this.townsService.update(id, updateTownDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete town (Admin only)' })
  async removeAdmin(@Param('id') id: string, @GetUser() user: User) {
    if (!user.isSuperUser) {
      throw new ForbiddenException('Only super users can access this endpoint');
    }
    return this.townsService.remove(id);
  }

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  @Post()
  create(@Body() createTownDto: CreateTownDto) {
    return this.townsService.create(createTownDto);
  }

  @Get()
  findAll() {
    return this.townsService.findAll();
  }

  @Get('for-map')
  @ApiOperation({ summary: 'Get all towns with coordinates for map display' })
  findAllForMap() {
    return this.townsService.findAllForMap();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.townsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTownDto: UpdateTownDto) {
    return this.townsService.update(id, updateTownDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.townsService.remove(id);
  }
}
