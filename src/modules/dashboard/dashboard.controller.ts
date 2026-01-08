import { Controller, Get, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService, DashboardStats } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { TENANT_ID_KEY } from '../tenant/tenant.interceptor';
import { Request } from 'express';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  async getStats(@GetUser() user: User, @Req() request: Request): Promise<DashboardStats> {
    const tenantId = (request as any)[TENANT_ID_KEY];

    // Super users can see all stats (or filtered by tenant if on a subdomain)
    if (user.isSuperUser) {
      return this.dashboardService.getStats(tenantId);
    }

    // Non-super users must have access to the tenant
    if (!tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }

    // Check if user has access to this tenant
    const userTowns = user.towns || [];
    const hasAccess = userTowns.some((town: any) => town.id === tenantId);

    if (!hasAccess) {
      throw new ForbiddenException('No tienes acceso a este municipio');
    }

    return this.dashboardService.getStats(tenantId);
  }
}
