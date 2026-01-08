import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Lodging } from '../lodgings/entities/lodging.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Place } from '../places/entities/place.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Review } from '../reviews/entities/review.entity';
import { Guide } from '../guides/entities/guide.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { Transport } from '../transport/entities/transport.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lodging,
      Restaurant,
      Place,
      Commerce,
      Review,
      Guide,
      Experience,
      Transport,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
