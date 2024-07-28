import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TownsService } from './services';
import { TownsController, MucipalitiesController } from './controllers';
import { Department, Town, TownFestivity, TownInfo } from './entities';
import { MunicipalitiesService } from './services/municipalities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Town, TownInfo, TownFestivity])],
  controllers: [TownsController, MucipalitiesController],
  providers: [TownsService, MunicipalitiesService],
})
export class TownsModule {}
