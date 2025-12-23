import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewsController } from './reviews.controller';
import { PlaceReviewsService, ReviewsService, EntityReviewsService } from './services';

import { Place } from '../places/entities';
import { Review, ReviewImage, ReviewStatusHistory } from './entities';
import { User, UserPoint } from '../users/entities';
import { TinifyService } from '../tinify/tinify.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ImageResource } from '../core/entities';
import { PublicReviewsController } from './public-reviews.controller';

// Entidades para reviews universales
import { Lodging } from '../lodgings/entities';
import { Restaurant } from '../restaurants/entities';
import { Commerce } from '../commerce/entities';
import { Experience } from '../experiences/entities';
import { Transport } from '../transport/entities';
import { Guide } from '../guides/entities';

// Controllers de reviews por entidad
import {
  LodgingReviewsController,
  RestaurantReviewsController,
  CommerceReviewsController,
  ExperienceReviewsController,
  TransportReviewsController,
  GuideReviewsController,
} from './entity-reviews.controller';

@Module({
  controllers: [
    ReviewsController,
    PublicReviewsController,
    LodgingReviewsController,
    RestaurantReviewsController,
    CommerceReviewsController,
    ExperienceReviewsController,
    TransportReviewsController,
    GuideReviewsController,
  ],
  providers: [PlaceReviewsService, ReviewsService, EntityReviewsService, TinifyService, CloudinaryService],
  imports: [
    TypeOrmModule.forFeature([
      Review,
      Place,
      ReviewStatusHistory,
      User,
      UserPoint,
      ImageResource,
      ReviewImage,
      // Entidades para reviews universales
      Lodging,
      Restaurant,
      Commerce,
      Experience,
      Transport,
      Guide,
    ]),
  ],
  exports: [PlaceReviewsService, EntityReviewsService],
})
export class ReviewsModule {}
