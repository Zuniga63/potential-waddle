import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Plan, PlanFeature, Subscription, Payment } from './entities';
import { PlansService, SubscriptionsService, PaymentsService, WompiService } from './services';
import { PlansController, AdminPlansController, SubscriptionsController, AdminSubscriptionsController, WebhooksController } from './controllers';
import { User } from '../users/entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Plan, PlanFeature, Subscription, Payment, User]),
  ],
  controllers: [PlansController, AdminPlansController, SubscriptionsController, AdminSubscriptionsController, WebhooksController],
  providers: [PlansService, SubscriptionsService, PaymentsService, WompiService],
  exports: [PlansService, SubscriptionsService, PaymentsService, WompiService],
})
export class SubscriptionsModule {}
