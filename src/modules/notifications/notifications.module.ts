import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { User } from '../users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
