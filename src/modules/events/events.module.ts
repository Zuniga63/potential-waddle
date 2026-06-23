import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { GeoIpService } from './enrichment/geo-ip.service';
import { BotFilterService } from './enrichment/bot-filter.service';
import { DeviceParserService } from './enrichment/device-parser.service';
import { Event } from './entities';
import { User } from '../users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Event, User])],
  controllers: [EventsController],
  providers: [EventsService, GeoIpService, BotFilterService, DeviceParserService],
  exports: [EventsService],
})
export class EventsModule {}
