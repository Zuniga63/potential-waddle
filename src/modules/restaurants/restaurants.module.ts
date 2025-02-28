import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ImageResource, Category, Facility } from '../core/entities';
import { Restaurant } from './entities';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Town } from '../towns/entities';
import { User } from '../users/entities';
@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  imports: [TypeOrmModule.forFeature([Restaurant, ImageResource, Category, Facility, Town, User]), CloudinaryModule],
})
export class RestaurantsModule {}
