import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TownsService, TownImagesService } from './services';
import { TownsController, MucipalitiesController } from './controllers';
import { Department, Town, TownFestivity, TownInfo, TownImage } from './entities';
import { MunicipalitiesService } from './services/municipalities.service';
import { User } from '../users/entities/user.entity';
import { ImageResource } from '../core/entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, Town, TownInfo, TownFestivity, TownImage, User, ImageResource]),
    CloudinaryModule,
  ],
  controllers: [TownsController, MucipalitiesController],
  providers: [TownsService, MunicipalitiesService, TownImagesService],
  exports: [TownsService, TownImagesService],
})
export class TownsModule {}
