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
import { GoogleReviewSummary } from './entities/google-review-summary.entity';
import { GoogleReviewSyncLog } from './entities/google-review-sync-log.entity';
import { ApifyReviewsService } from './services/apify-reviews.service';
import { PlaceIdResolverService } from './services/place-id-resolver.service';
import { GOOGLE_REVIEWS_SOURCE } from './interfaces/google-reviews-source.interface';

@Module({
  controllers: [GooglePlacesController],
  providers: [
    GooglePlacesService,
    PlaceIdResolverService,
    ApifyReviewsService,
    { provide: GOOGLE_REVIEWS_SOURCE, useClass: ApifyReviewsService },
  ],
  imports: [
    TypeOrmModule.forFeature([Lodging, Restaurant, Commerce, GoogleReview, GoogleReviewSummary, GoogleReviewSyncLog]),
    HttpModule,
    ConfigModule,
  ],
  exports: [GooglePlacesService, PlaceIdResolverService],
})
export class GooglePlacesModule {}
