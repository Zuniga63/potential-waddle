import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappClicksService } from './whatsapp-clicks.service';
import { WhatsappClicksController } from './whatsapp-clicks.controller';
import { WhatsappClicksReadAdapter } from './whatsapp-clicks-read.adapter';
import { WhatsappClick } from './entities';
import { Event } from '../events/entities';
import { User } from '../users/entities';

// MIG-01: the read adapter queries the generic `events` table via the injected DataSource,
// so `Event` is registered in forFeature. `WhatsappClick` stays registered — the legacy
// table is retained (read-only) pending the user's prod cutover and is NOT dropped here.
@Module({
  imports: [TypeOrmModule.forFeature([WhatsappClick, Event, User])],
  controllers: [WhatsappClicksController],
  providers: [WhatsappClicksService, WhatsappClicksReadAdapter],
  exports: [WhatsappClicksService],
})
export class WhatsappClicksModule {}
