import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppIcon, Category, Facility, ImageResource, Language, Model, AppConfig } from './entities';
import { CategoriesService, FacilitiesService, LanguagesService, ModelsService, AppIconsService, AppConfigService } from './services';
import { CategoriesController, FacilitiesController, LanguagesController, ModelsController, AppIconsController, AppConfigController } from './controllers';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Model, Facility, Category, ImageResource, Language, AppIcon, AppConfig]),
    CloudinaryModule,
  ],
  controllers: [ModelsController, FacilitiesController, CategoriesController, LanguagesController, AppIconsController, AppConfigController],
  providers: [ModelsService, FacilitiesService, CategoriesService, LanguagesService, AppIconsService, AppConfigService],
})
export class CoreModule {}
