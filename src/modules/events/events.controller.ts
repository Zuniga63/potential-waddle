import { Body, Controller, HttpCode, HttpStatus, Ip, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { OptionalAuth } from '../auth/decorators';
import { TenantId } from '../tenant/tenant.decorator';
import { CreateEventDto } from './dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events') // real path is /api/events due to the global 'api' prefix (Pitfall 6)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Post()
  @OptionalAuth() // attaches req.user if Bearer present, else anonymous — never 401 (T-15-04)
  @HttpCode(HttpStatus.ACCEPTED) // 202 — fire-and-forget, not awaiting the write (EVENT-01)
  @ApiOperation({ summary: 'Ingest a generic analytics event (fire-and-forget)' })
  @ApiResponse({ status: 202, description: 'Event accepted' })
  async ingest(
    @Body() dto: CreateEventDto,
    @Ip() ip: string,
    @TenantId() townId: string | null, // server-derived via global TenantInterceptor (D-04)
    @Req() req: Request,
  ): Promise<void> {
    const userAgent = (req.headers['user-agent'] as string) ?? null;
    const user = (req as any).user ?? null; // set by @OptionalAuth
    // Do NOT await — 202 returns immediately; ingest never throws to the client.
    void this.events.ingest({ dto, ip, townId, userAgent, user });
  }
}
