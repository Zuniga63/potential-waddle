import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lodging } from '../lodgings/entities/lodging.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Transport } from '../transport/entities/transport.entity';
import { Guide } from '../guides/entities/guide.entity';
import { Place } from '../places/entities/place.entity';
import { Experience } from '../experiences/entities/experience.entity';

import { ForcedPublicController } from './forced-public.controller';
import { ForcedPublicService } from './forced-public.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lodging, Restaurant, Commerce, Transport, Guide, Place, Experience])],
  controllers: [ForcedPublicController],
  providers: [ForcedPublicService],
})
export class ForcedPublicModule {}
