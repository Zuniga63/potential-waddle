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
import { GoogleSyncService } from './services/google-sync.service';
import { GoogleSyncCronService } from './services/google-sync-cron.service';
import { GoogleSyncManualService } from './services/google-sync-manual.service';
import { GoogleReconciliationCronService } from './services/google-reconciliation-cron.service';
import { GOOGLE_REVIEWS_SOURCE } from './interfaces/google-reviews-source.interface';
import { CommonModule } from '../common/common.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  controllers: [GooglePlacesController],
  providers: [
    GooglePlacesService,
    PlaceIdResolverService,
    ApifyReviewsService,
    GoogleSyncService,
    GoogleSyncCronService,
    GoogleSyncManualService,
    GoogleReconciliationCronService,
    { provide: GOOGLE_REVIEWS_SOURCE, useClass: ApifyReviewsService },
  ],
  imports: [
    TypeOrmModule.forFeature([Lodging, Restaurant, Commerce, GoogleReview, GoogleReviewSummary, GoogleReviewSyncLog]),
    HttpModule,
    ConfigModule,
    CommonModule,
    SubscriptionsModule,
  ],
  exports: [GooglePlacesService, PlaceIdResolverService, GoogleSyncService],
})
export class GooglePlacesModule {}
