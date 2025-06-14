import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { Place, PlaceImage } from '../places/entities';
import { Lodging, LodgingImage } from '../lodgings/entities';
import { Restaurant, RestaurantImage } from '../restaurants/entities';
import { Experience, ExperienceImage } from '../experiences/entities';
import { ImageResource } from '../core/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Place,
      PlaceImage,
      Lodging,
      LodgingImage,
      Restaurant,
      RestaurantImage,
      Experience,
      ExperienceImage,
      ImageResource,
    ]),
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
