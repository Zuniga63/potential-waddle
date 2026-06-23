import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities';
import { User } from '../users/entities';
import { CreateEventDto } from './dto';
import { sanitizeProperties } from './constants/event-properties-allowlist';
import { GeoIpService } from './enrichment/geo-ip.service';
import { BotFilterService } from './enrichment/bot-filter.service';
import { DeviceParserService } from './enrichment/device-parser.service';

/**
 * Input for a single ingest. Everything privacy/tenant-sensitive is server-derived
 * by the controller and passed here explicitly:
 *   - `townId` comes ONLY from the global TenantInterceptor (@TenantId), never the dto (T-15-01)
 *   - `ip` is used in-memory for geo lookup only and is NEVER persisted (D-06)
 *   - `user` is attached by @OptionalAuth (null when anonymous)
 */
export interface IngestInput {
  dto: CreateEventDto;
  ip: string | null | undefined;
  townId: string | null;
  userAgent: string | null;
  user: { id: string } | null;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly geoIp: GeoIpService,
    private readonly botFilter: BotFilterService,
    private readonly deviceParser: DeviceParserService,
  ) {}

  /**
   * Fire-and-forget ingest (EVENT-01). Enriches server-side (geo/device/bot/identity),
   * sanitizes properties, and persists one row. The whole body is wrapped in a
   * try/catch that logs failures via Logger.error and swallows them (EVENT-08 /
   * Pitfall 8) — contrast with whatsapp-clicks.service which propagates the error.
   * The caller does not await this, so propagating would become an unhandled rejection.
   */
  async ingest(input: IngestInput): Promise<void> {
    try {
      const { dto } = input;

      // D-03: entity-scoped events MUST resolve to a town server-side. An entity event
      // whose tenant could not be resolved (e.g. missing/invalid x-tenant) is a client
      // misconfiguration — drop it rather than silently persist town_id=null, which would
      // corrupt per-town analytics. Apex/platform events (no entity) legitimately have null.
      const isEntityScoped = !!(dto.entityType || dto.entityId);
      if (isEntityScoped && !input.townId) {
        this.logger.warn(
          `(events.ingest) dropped entity-scoped ${dto.eventType} event for entity ${dto.entityType ?? '?'}:${dto.entityId ?? '?'} — no resolvable town (missing/invalid x-tenant)`,
        );
        return;
      }

      const geo = this.geoIp.lookup(input.ip); // IP used here ONLY; never stored (D-06)
      const device = this.deviceParser.parse(input.userAgent);
      const isBot = this.botFilter.isBot(input.userAgent);
      const properties = sanitizeProperties(dto.eventType, dto.properties);

      const row = this.eventRepo.create({
        eventType: dto.eventType,
        townId: input.townId, // server-derived only (D-04 / T-15-01); may be null for apex (D-03)
        entityType: dto.entityType ?? null,
        entityId: dto.entityId ?? null,
        entitySlug: dto.entitySlug ?? null,
        sessionId: dto.sessionId ?? null,
        userId: input.user?.id ?? null,
        country: geo.country,
        department: geo.department,
        city: geo.city,
        browser: device.browser,
        os: device.os,
        deviceType: device.deviceType,
        isBot,
        isInternal: !!input.user,
        referrer: dto.referrer ?? null,
        pagePath: dto.pagePath ?? null,
        timeOnPage: dto.timeOnPage ?? null,
        properties,
      });

      await this.eventRepo.save(row);
    } catch (error) {
      this.logger.error(
        '(events.ingest) failed to persist event',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
