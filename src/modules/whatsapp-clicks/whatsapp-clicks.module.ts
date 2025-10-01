import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappClicksService } from './whatsapp-clicks.service';
import { WhatsappClicksController } from './whatsapp-clicks.controller';
import { WhatsappClick } from './entities';
import { User } from '../users/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsappClick,
      User,
    ]),
  ],
  controllers: [WhatsappClicksController],
  providers: [WhatsappClicksService],
  exports: [WhatsappClicksService],
})
export class WhatsappClicksModule {}
