import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TownsService } from './services';
import { TownsController, MucipalitiesController } from './controllers';
import { Department, Town, TownFestivity, TownInfo } from './entities';
import { MunicipalitiesService } from './services/municipalities.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Town, TownInfo, TownFestivity, User])],
  controllers: [TownsController, MucipalitiesController],
  providers: [TownsService, MunicipalitiesService],
})
export class TownsModule {}
