import { Module } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { SeedsController } from './seeds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department, Town } from '../towns/entities';
import { Category, Facility, Language, Model } from '../core/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Town, Model, Category, Language, Facility])],
  controllers: [SeedsController],
  providers: [SeedsService],
})
export class SeedsModule {}
