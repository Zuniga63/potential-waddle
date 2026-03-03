import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Experience } from 'src/modules/experiences/entities/experience.entity';
import { Transport } from 'src/modules/transport/entities/transport.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { Guide } from 'src/modules/guides/entities/guide.entity';
import { Category } from 'src/modules/core/entities/category.entity';
import { Facility } from 'src/modules/core/entities/facility.entity';
import { Menu } from 'src/modules/restaurants/entities/menu.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lodging,
      Restaurant,
      Experience,
      Transport,
      Commerce,
      Guide,
      Category,
      Facility,
      Menu,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
