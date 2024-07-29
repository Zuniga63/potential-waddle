import { Module } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { SeedsController } from './seeds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department, Town } from '../towns/entities';
import { Category, Facility, ImageResource, Language, Model } from '../core/entities';
import { Place, PlaceImage } from '../places/entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      Town,
      Model,
      Category,
      Language,
      Facility,
      Place,
      PlaceImage,
      ImageResource,
      CloudinaryModule,
    ]),
    CloudinaryModule,
  ],
  controllers: [SeedsController],
  providers: [SeedsService],
})
export class SeedsModule {}
