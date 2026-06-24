import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { GeoIpService } from './enrichment/geo-ip.service';
import { BotFilterService } from './enrichment/bot-filter.service';
import { DeviceParserService } from './enrichment/device-parser.service';
import { GeoipRefreshCron } from './geoip-refresh.cron';
import { EventsCanaryCron } from './events-canary.cron';
import { EntityAnalyticsService } from './entity-analytics.service';
import { EntityOwnershipResolver } from './entity-ownership.resolver';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { Event } from './entities';
import { User } from '../users/entities';

@Module({
  // EntityAnalyticsService + EntityOwnershipResolver use the injected DataSource (raw SQL),
  // so no extra TypeOrmModule.forFeature entities are required for the read endpoint.
  imports: [TypeOrmModule.forFeature([Event, User])],
  controllers: [EventsController],
  providers: [
    EventsService,
    GeoIpService,
    BotFilterService,
    DeviceParserService,
    GeoipRefreshCron,
    EventsCanaryCron,
    EntityAnalyticsService,
    EntityOwnershipResolver,
    PlatformAnalyticsService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
