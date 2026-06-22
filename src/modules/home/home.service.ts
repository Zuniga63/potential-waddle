import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from '../places/entities';
import { Lodging } from '../lodgings/entities';
import { Restaurant } from '../restaurants/entities';
import { Experience } from '../experiences/entities';
import { HomeItemDto, HomeDataDto } from './dto';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
  ) {}

  async getHomeData(tenantId?: string | null): Promise<HomeDataDto> {
    const [places, lodgings, restaurants, experiences] = await Promise.all([
      this.getRandomPlaces(tenantId),
      this.getRandomLodgings(tenantId),
      this.getRandomRestaurants(tenantId),
      this.getRandomExperiences(tenantId),
    ]);

    return {
      places,
      lodgings,
      restaurants,
      experiences,
    };
  }

  private async getRandomPlaces(tenantId?: string | null): Promise<HomeItemDto[]> {
    const query = this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.images', 'images', 'images.isPublic = :imageIsPublic AND images.order = 1')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .where('place.isPublic = :isPublic', { isPublic: true })
      .setParameter('imageIsPublic', true);

    // Scope to the current tenant's town (apex / no tenant → unfiltered).
    if (tenantId) {
      query.innerJoin('place.town', 'town').andWhere('town.id = :tenantId', { tenantId });
    }

    const places = await query.orderBy('RANDOM()').limit(6).getMany();

    return places.map(place => ({
      id: place.id,
      name: place.name,
      slug: place.slug,
      image: place.images?.[0]?.imageResource?.url,
    }));
  }

  private async getRandomLodgings(tenantId?: string | null): Promise<HomeItemDto[]> {
    const query = this.lodgingRepository
      .createQueryBuilder('lodging')
      .leftJoinAndSelect('lodging.images', 'images', 'images.isPublic = :imageIsPublic AND images.order = 1')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .where('lodging.isPublic = :isPublic', { isPublic: true })
      .setParameter('imageIsPublic', true);

    if (tenantId) {
      query.innerJoin('lodging.town', 'town').andWhere('town.id = :tenantId', { tenantId });
    }

    const lodgings = await query.orderBy('RANDOM()').limit(6).getMany();

    return lodgings.map(lodging => ({
      id: lodging.id,
      name: lodging.name,
      slug: lodging.slug,
      image: lodging.images?.[0]?.imageResource?.url,
    }));
  }

  private async getRandomRestaurants(tenantId?: string | null): Promise<HomeItemDto[]> {
    const query = this.restaurantRepository
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.images', 'images', 'images.isPublic = :imageIsPublic AND images.order = 1')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .where('restaurant.isPublic = :isPublic', { isPublic: true })
      .setParameter('imageIsPublic', true);

    if (tenantId) {
      query.innerJoin('restaurant.town', 'town').andWhere('town.id = :tenantId', { tenantId });
    }

    const restaurants = await query.orderBy('RANDOM()').limit(6).getMany();

    return restaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      image: restaurant.images?.[0]?.imageResource?.url,
    }));
  }

  private async getRandomExperiences(tenantId?: string | null): Promise<HomeItemDto[]> {
    const query = this.experienceRepository
      .createQueryBuilder('experience')
      .leftJoinAndSelect('experience.images', 'images', 'images.isPublic = :imageIsPublic AND images.order = 1')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .where('experience.isPublic = :isPublic', { isPublic: true })
      .setParameter('imageIsPublic', true);

    if (tenantId) {
      query.innerJoin('experience.town', 'town').andWhere('town.id = :tenantId', { tenantId });
    }

    const experiences = await query.orderBy('RANDOM()').limit(6).getMany();

    return experiences.map(experience => ({
      id: experience.id,
      name: experience.title, // Note: Experience entity uses 'title' instead of 'name'
      slug: experience.slug,
      image: experience.images?.[0]?.imageResource?.url,
    }));
  }
}
