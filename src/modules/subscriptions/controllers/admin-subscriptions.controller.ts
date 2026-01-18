import { Controller, Get, Post, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { SuperAdmin } from '../../auth/decorators';
import { SubscriptionsService } from '../services';
import { SubscriptionDto } from '../dto';
import { EntityType } from '../entities';

@Controller('subscriptions/admin')
@ApiTags('Admin - Subscriptions')
@SuperAdmin()
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get all subscriptions (admin)' })
  @ApiOkResponse({ description: 'Paginated list of subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, enum: ['lodging', 'restaurant', 'commerce', 'transport', 'guide'] })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'updatedAt', 'currentPeriodEnd'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('entityType') entityType?: EntityType,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'currentPeriodEnd',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.subscriptionsService.findAllAdmin({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      entityType,
      sortBy,
      sortOrder,
    });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription (admin)' })
  @ApiOkResponse({ description: 'Subscription canceled', type: SubscriptionDto })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.adminCancel(id);
  }
}
