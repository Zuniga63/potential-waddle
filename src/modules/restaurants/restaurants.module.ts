import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { ImageResource, Category, Facility } from '../core/entities';
import { Restaurant, Menu } from './entities';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { MenuController } from './menu.controller';
import { MenuService } from './services/menu.service';
import { KmizenService } from './services/kmizen.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Town } from '../towns/entities';
import { User } from '../users/entities';
import { PromotionsModule } from '../promotions/promotions.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  controllers: [RestaurantsController, MenuController],
  providers: [RestaurantsService, MenuService, KmizenService],
  imports: [
    TypeOrmModule.forFeature([Restaurant, ImageResource, Category, Facility, Town, User, Menu]),
    HttpModule,
    ConfigModule,
    CloudinaryModule,
    PromotionsModule,
    ReviewsModule,
  ],
})
export class RestaurantsModule {}
