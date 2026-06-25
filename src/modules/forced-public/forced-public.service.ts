import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lodging } from '../lodgings/entities/lodging.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Transport } from '../transport/entities/transport.entity';
import { Guide } from '../guides/entities/guide.entity';
import { Place } from '../places/entities/place.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { ForcedPublicEntityType } from './dto/set-forced-public.dto';

/**
 * Super-admin override that forces an entity to be publicly visible, bypassing
 * the normal gate (status='published' + is_public + active subscription). The
 * public queries apply it with an OR; this service only flips the `forced_public`
 * column on the right table.
 */
@Injectable()
export class ForcedPublicService {
  private readonly repos: Record<ForcedPublicEntityType, Repository<{ id: string; forcedPublic: boolean }>>;

  constructor(
    @InjectRepository(Lodging) lodgingRepo: Repository<Lodging>,
    @InjectRepository(Restaurant) restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Commerce) commerceRepo: Repository<Commerce>,
    @InjectRepository(Transport) transportRepo: Repository<Transport>,
    @InjectRepository(Guide) guideRepo: Repository<Guide>,
    @InjectRepository(Place) placeRepo: Repository<Place>,
    @InjectRepository(Experience) experienceRepo: Repository<Experience>,
  ) {
    this.repos = {
      lodging: lodgingRepo as unknown as Repository<{ id: string; forcedPublic: boolean }>,
      restaurant: restaurantRepo as unknown as Repository<{ id: string; forcedPublic: boolean }>,
      commerce: commerceRepo as unknown as Repository<{ id: string; forcedPublic: boolean }>,
      transport: transportRepo as unknown as Repository<{ id: string; forcedPublic: boolean }>,
      guide: guideRepo as unknown as Repository<{ id: string; forcedPublic: boolean }>,
      place: placeRepo as unknown as Repository<{ id: string; forcedPublic: boolean }>,
      experience: experienceRepo as unknown as Repository<{ id: string; forcedPublic: boolean }>,
    };
  }

  async setForcedPublic(
    entityType: ForcedPublicEntityType,
    id: string,
    forcedPublic: boolean,
  ): Promise<{ id: string; forcedPublic: boolean }> {
    const repo = this.repos[entityType];
    const exists = await repo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException(`${entityType} ${id} not found`);
    await repo.update(id, { forcedPublic });
    return { id, forcedPublic };
  }
}
