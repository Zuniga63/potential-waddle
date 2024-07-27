import { Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place, PlaceImage } from './entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Category, Facility, ImageResource } from '../core/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Place, Category, Facility, ImageResource, PlaceImage]), CloudinaryModule],
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
