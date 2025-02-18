import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lodging, LodgingImage } from './entities';
import { LodgingsService } from './lodgings.service';
import { LodgingsController } from './lodgings.controller';
import { Category } from '../core/entities';

@Module({
  controllers: [LodgingsController],
  providers: [LodgingsService],
  imports: [TypeOrmModule.forFeature([Lodging, LodgingImage, Category])],
})
export class LodgingsModule {}
