import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities';
import { PlaceReviewsService } from './services';
import { Place } from '../places/entities';

@Module({
  controllers: [],
  providers: [PlaceReviewsService],
  imports: [TypeOrmModule.forFeature([Review, Place])],
  exports: [PlaceReviewsService],
})
export class ReviewsModule {}
