import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewsController } from './reviews.controller';
import { PlaceReviewsService, ReviewsService } from './services';

import { Place } from '../places/entities';
import { Review, ReviewImage, ReviewStatusHistory } from './entities';
import { User, UserPoint } from '../users/entities';
import { TinifyService } from '../tinify/tinify.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ImageResource } from '../core/entities';
import { PublicReviewsController } from './public-reviews.controller';
@Module({
  controllers: [ReviewsController, PublicReviewsController],
  providers: [PlaceReviewsService, ReviewsService, TinifyService, CloudinaryService],
  imports: [
    TypeOrmModule.forFeature([Review, Place, ReviewStatusHistory, User, UserPoint, ImageResource, ReviewImage]),
  ],
  exports: [PlaceReviewsService],
})
export class ReviewsModule {}
