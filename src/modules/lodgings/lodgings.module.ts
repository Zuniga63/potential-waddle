import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lodging, LodgingImage } from './entities';
import { LodgingsService } from './lodgings.service';
import { LodgingsController } from './lodgings.controller';
import { Category, Facility } from '../core/entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { User } from '../users/entities';
import { Town } from '../towns/entities';

@Module({
  controllers: [LodgingsController],
  providers: [LodgingsService],
  imports: [TypeOrmModule.forFeature([Lodging, LodgingImage, Category, User, Town, Facility]), CloudinaryModule],
})
export class LodgingsModule {}
