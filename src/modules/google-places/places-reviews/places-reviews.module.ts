import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlacesReviewsService } from './places-reviews.service';
import { ConfigModule } from '@nestjs/config';
import { PlacesReviewsController } from './places-reviews.controller';

@Module({
  controllers: [PlacesReviewsController],
  providers: [PlacesReviewsService],
  imports: [HttpModule, ConfigModule],
})
export class PlacesReviewsModule {}
