import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { Lodging } from '../lodgings/entities/lodging.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Place } from '../places/entities/place.entity';
import { Guide } from '../guides/entities/guide.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lodging,
      Restaurant,
      Experience,
      Commerce,
      Place,
      Guide,
    ]),
  ],
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService],
})
export class MapModule {}
