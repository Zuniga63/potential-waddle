import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lodging, LodgingImage, LodgingPlace, LodgingRoomType, LodgingRoomTypeImage } from './entities';
import { LodgingsService } from './lodgings.service';
import { LodgingsController } from './lodgings.controller';
import { LodgingRoomTypesService } from './lodging-room-types.service';
import { LodgingRoomTypesController } from './lodging-room-types.controller';
import { Category, Facility } from '../core/entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { User } from '../users/entities';
import { Town } from '../towns/entities';
import { Place } from '../places/entities';
import { GooglePlacesModule } from '../google-places/google-places.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  controllers: [LodgingsController, LodgingRoomTypesController],
  providers: [LodgingsService, LodgingRoomTypesService],
  imports: [
    TypeOrmModule.forFeature([
      Lodging,
      LodgingImage,
      Category,
      User,
      Town,
      Facility,
      LodgingPlace,
      Place,
      LodgingRoomType,
      LodgingRoomTypeImage,
    ]),
    CloudinaryModule,
    GooglePlacesModule,
    PromotionsModule,
    ReviewsModule,
  ],
  exports: [LodgingRoomTypesService],
})
export class LodgingsModule {}
