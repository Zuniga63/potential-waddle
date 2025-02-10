import { Module } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { GuidesController } from './guides.controller';
import { User } from '../users/entities';
import { Town } from '../towns/entities';
import { Category } from '../core/entities';
import { Guide } from './entities/guide.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [GuidesController],
  providers: [GuidesService],
  imports: [TypeOrmModule.forFeature([Guide, Category, Town, User])],
})
export class GuidesModule {}
