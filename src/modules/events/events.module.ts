import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { GeoIpService } from './enrichment/geo-ip.service';
import { BotFilterService } from './enrichment/bot-filter.service';
import { DeviceParserService } from './enrichment/device-parser.service';
import { GeoipRefreshCron } from './geoip-refresh.cron';
import { EventsCanaryCron } from './events-canary.cron';
import { Event } from './entities';
import { User } from '../users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Event, User])],
  controllers: [EventsController],
  providers: [
    EventsService,
    GeoIpService,
    BotFilterService,
    DeviceParserService,
    GeoipRefreshCron,
    EventsCanaryCron,
  ],
  exports: [EventsService],
})
export class EventsModule {}
