import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lodging, LodgingImage } from './entities';
import { LodgingsService } from './lodgings.service';
import { LodgingsController } from './lodgings.controller';

@Module({
  controllers: [LodgingsController],
  providers: [LodgingsService],
  imports: [TypeOrmModule.forFeature([Lodging, LodgingImage])],
})
export class LodgingsModule {}
