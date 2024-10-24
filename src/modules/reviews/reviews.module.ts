import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewsController } from './reviews.controller';
import { PlaceReviewsService, ReviewsService } from './services';

import { Place } from '../places/entities';
import { Review, ReviewStatusHistory } from './entities';

@Module({
  controllers: [ReviewsController],
  providers: [PlaceReviewsService, ReviewsService],
  imports: [TypeOrmModule.forFeature([Review, Place, ReviewStatusHistory])],
  exports: [PlaceReviewsService],
})
export class ReviewsModule {}
