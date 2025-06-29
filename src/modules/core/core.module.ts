import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppIcon, Category, Facility, ImageResource, Language, Model } from './entities';
import { CategoriesService, FacilitiesService, LanguagesService, ModelsService, AppIconsService } from './services';
import { CategoriesController, FacilitiesController, LanguagesController, ModelsController, AppIconsController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Model, Facility, Category, ImageResource, Language, AppIcon])],
  controllers: [ModelsController, FacilitiesController, CategoriesController, LanguagesController, AppIconsController],
  providers: [ModelsService, FacilitiesService, CategoriesService, LanguagesService, AppIconsService],
})
export class CoreModule {}
