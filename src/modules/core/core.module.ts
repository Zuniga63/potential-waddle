import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppIcon, Category, Facility, ImageResource, Language, Model } from './entities';
import { CategoriesService, FacilitiesService, LanguagesService, ModelsService } from './services';
import { CategoriesController, FacilitiesController, LanguagesController, ModelsController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Model, Facility, Category, ImageResource, Language, AppIcon])],
  controllers: [ModelsController, FacilitiesController, CategoriesController, LanguagesController],
  providers: [ModelsService, FacilitiesService, CategoriesService, LanguagesService],
})
export class CoreModule {}
