import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Lodging } from '../lodgings/entities';
import { Restaurant } from '../restaurants/entities';
import { Commerce } from '../commerce/entities';
import { GooglePlacesService } from './google-places.service';
import { GooglePlacesController } from './google-places.controller';
import { HttpModule } from '@nestjs/axios';
import { GoogleReview } from './entities/google-review.entity';
import { PineconeModule } from '../pinecone/pinecone.module';
import { GoogleReviewSummary } from './entities/google-review-summary.entity';

@Module({
  controllers: [GooglePlacesController],
  providers: [GooglePlacesService],
  imports: [
    TypeOrmModule.forFeature([Lodging, Restaurant, Commerce, GoogleReview, GoogleReviewSummary]),
    HttpModule,
    ConfigModule,
    PineconeModule,
  ],
  exports: [GooglePlacesService],
})
export class GooglePlacesModule {}
