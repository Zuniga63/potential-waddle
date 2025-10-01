import { Controller, Post, Get, Body, Query, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WhatsappClicksService } from './whatsapp-clicks.service';
import { CreateWhatsappClickDto } from './dto';

@ApiTags('WhatsApp Clicks')
@Controller('whatsapp-clicks')
export class WhatsappClicksController {
  constructor(private readonly whatsappClicksService: WhatsappClicksService) {}

  @Post()
  @ApiOperation({ summary: 'Track a WhatsApp click' })
  @ApiResponse({ status: 201, description: 'Click tracked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async trackClick(
    @Body() createDto: CreateWhatsappClickDto,
    @Ip() ipAddress: string,
  ) {
    return this.whatsappClicksService.create(createDto, ipAddress);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get WhatsApp click analytics' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(
    @Query('entityId') entityId?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.whatsappClicksService.getAnalytics(entityId, entityType);
  }

  @Get('analytics/detailed')
  @ApiOperation({ summary: 'Get detailed WhatsApp click analytics for entity dashboard' })
  @ApiQuery({ name: 'entityId', required: true, description: 'Entity ID' })
  @ApiQuery({ name: 'entityType', required: true, description: 'Entity type' })
  @ApiResponse({ status: 200, description: 'Detailed analytics retrieved successfully' })
  async getDetailedAnalytics(
    @Query('entityId') entityId: string,
    @Query('entityType') entityType: string,
  ) {
    return this.whatsappClicksService.getDetailedAnalytics(entityId, entityType);
  }
}
