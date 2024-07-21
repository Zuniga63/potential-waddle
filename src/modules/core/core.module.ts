import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Facility, ImageAsset, Model } from './entities';
import { CategoriesService, FacilitiesService, ModelsService } from './services';
import { CategoriesController, FacilitiesController, ModelsController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Model, Facility, Category, ImageAsset])],
  controllers: [ModelsController, FacilitiesController, CategoriesController],
  providers: [ModelsService, FacilitiesService, CategoriesService],
})
export class CoreModule {}
