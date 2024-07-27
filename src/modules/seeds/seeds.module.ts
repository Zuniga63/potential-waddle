import { Module } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { SeedsController } from './seeds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Municipality, Town } from '../towns/entities';
import { Category, Facility, Language, Model } from '../core/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Municipality, Town, Model, Category, Language, Facility])],
  controllers: [SeedsController],
  providers: [SeedsService],
})
export class SeedsModule {}
