import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lodging } from '../lodgings/entities/lodging.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Place } from '../places/entities/place.entity';

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'lodging' | 'restaurant' | 'experience' | 'commerce' | 'place';
  latitude: number;
  longitude: number;
  address: string | null;
  image: string | null;
  slug: string;
  distance: number; // en metros
}

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
  ) {}

  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula Haversine
   * @param lat1 Latitud del primer punto
   * @param lon1 Longitud del primer punto
   * @param lat2 Latitud del segundo punto
   * @param lon2 Longitud del segundo punto
   * @returns Distancia en metros
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  /**
   * Obtiene todos los lugares cercanos a una ubicación
   * @param latitude Latitud del usuario
   * @param longitude Longitud del usuario
   * @param radiusKm Radio de búsqueda en kilómetros
   * @param types Tipos de lugares a buscar (opcional)
   * @returns Array de lugares cercanos ordenados por distancia
   */
  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    types?: string[],
  ): Promise<NearbyPlace[]> {
    const radiusMeters = radiusKm * 1000;
    const allPlaces: NearbyPlace[] = [];

    // Determinar qué tipos buscar
    const typesToSearch = types && types.length > 0 ? types : [
      'lodging',
      'restaurant',
      'experience',
      'commerce',
      'place',
    ];

    // Buscar Lodgings
    if (typesToSearch.includes('lodging')) {
      const lodgings = await this.lodgingRepository
        .createQueryBuilder('lodging')
        .leftJoinAndSelect('lodging.images', 'images')
        .leftJoinAndSelect('images.imageResource', 'imageResource')
        .where('lodging.isPublic = :isPublic', { isPublic: true })
        .andWhere('lodging.stateDB = :stateDB', { stateDB: true })
        .andWhere(
          `ST_DWithin(
            lodging.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radius
          )`,
          { latitude, longitude, radius: radiusMeters },
        )
        .orderBy('images.order', 'ASC')
        .getMany();

      lodgings.forEach(lodging => {
        if (lodging.location && (lodging.location as any).coordinates) {
          const [lon, lat] = (lodging.location as any).coordinates;

          // Validar que las coordenadas sean números válidos
          if (typeof lat === 'number' && typeof lon === 'number' &&
              !isNaN(lat) && !isNaN(lon) &&
              lat !== 0 && lon !== 0) {
            const distance = this.calculateDistance(latitude, longitude, lat, lon);

            allPlaces.push({
              id: lodging.id,
              name: lodging.name,
              type: 'lodging',
              latitude: lat,
              longitude: lon,
              address: lodging.address,
              image: lodging.images?.[0]?.imageResource?.url || null,
              slug: lodging.slug,
              distance,
            });
          }
        }
      });
    }

    // Buscar Restaurants
    if (typesToSearch.includes('restaurant')) {
      const restaurants = await this.restaurantRepository
        .createQueryBuilder('restaurant')
        .leftJoinAndSelect('restaurant.images', 'images')
        .leftJoinAndSelect('images.imageResource', 'imageResource')
        .where('restaurant.isPublic = :isPublic', { isPublic: true })
        .andWhere(
          `ST_DWithin(
            restaurant.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radius
          )`,
          { latitude, longitude, radius: radiusMeters },
        )
        .orderBy('images.order', 'ASC')
        .getMany();

      restaurants.forEach(restaurant => {
        if (restaurant.location && (restaurant.location as any).coordinates) {
          const [lon, lat] = (restaurant.location as any).coordinates;

          if (typeof lat === 'number' && typeof lon === 'number' &&
              !isNaN(lat) && !isNaN(lon) &&
              lat !== 0 && lon !== 0) {
            const distance = this.calculateDistance(latitude, longitude, lat, lon);

            allPlaces.push({
              id: restaurant.id,
              name: restaurant.name,
              type: 'restaurant',
              latitude: lat,
              longitude: lon,
              address: restaurant.address,
              image: restaurant.images?.[0]?.imageResource?.url || null,
              slug: restaurant.slug,
              distance,
            });
          }
        }
      });
    }

    // Buscar Experiences
    if (typesToSearch.includes('experience')) {
      const experiences = await this.experienceRepository
        .createQueryBuilder('experience')
        .leftJoinAndSelect('experience.images', 'images')
        .leftJoinAndSelect('images.imageResource', 'imageResource')
        .where('experience.isPublic = :isPublic', { isPublic: true })
        .andWhere(
          `(
            ST_DWithin(
              experience.departureLocation::geography,
              ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
              :radius
            )
            OR
            ST_DWithin(
              experience.arrivalLocation::geography,
              ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
              :radius
            )
          )`,
          { latitude, longitude, radius: radiusMeters },
        )
        .orderBy('images.order', 'ASC')
        .getMany();

      experiences.forEach(experience => {
        // Usar departureLocation si existe, sino arrivalLocation
        const location = experience.departureLocation || experience.arrivalLocation;
        if (location && (location as any).coordinates) {
          const [lon, lat] = (location as any).coordinates;

          if (typeof lat === 'number' && typeof lon === 'number' &&
              !isNaN(lat) && !isNaN(lon) &&
              lat !== 0 && lon !== 0) {
            const distance = this.calculateDistance(latitude, longitude, lat, lon);

            allPlaces.push({
              id: experience.id,
              name: experience.title,
              type: 'experience',
              latitude: lat,
              longitude: lon,
              address: experience.departureDescription || experience.arrivalDescription || null,
              image: experience.images?.[0]?.imageResource?.url || null,
              slug: experience.slug,
              distance,
            });
          }
        }
      });
    }

    // Buscar Commerce
    if (typesToSearch.includes('commerce')) {
      const commerces = await this.commerceRepository
        .createQueryBuilder('commerce')
        .leftJoinAndSelect('commerce.images', 'images')
        .leftJoinAndSelect('images.imageResource', 'imageResource')
        .where('commerce.isPublic = :isPublic', { isPublic: true })
        .andWhere('commerce.stateDB = :stateDB', { stateDB: true })
        .andWhere(
          `ST_DWithin(
            commerce.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radius
          )`,
          { latitude, longitude, radius: radiusMeters },
        )
        .orderBy('images.order', 'ASC')
        .getMany();

      commerces.forEach(commerce => {
        if (commerce.location && (commerce.location as any).coordinates) {
          const [lon, lat] = (commerce.location as any).coordinates;

          if (typeof lat === 'number' && typeof lon === 'number' &&
              !isNaN(lat) && !isNaN(lon) &&
              lat !== 0 && lon !== 0) {
            const distance = this.calculateDistance(latitude, longitude, lat, lon);

            allPlaces.push({
              id: commerce.id,
              name: commerce.name,
              type: 'commerce',
              latitude: lat,
              longitude: lon,
              address: commerce.address,
              image: commerce.images?.[0]?.imageResource?.url || null,
              slug: commerce.slug,
              distance,
            });
          }
        }
      });
    }

    // Buscar Places
    if (typesToSearch.includes('place')) {
      const places = await this.placeRepository
        .createQueryBuilder('place')
        .leftJoinAndSelect('place.images', 'images')
        .leftJoinAndSelect('images.imageResource', 'imageResource')
        .where('place.isPublic = :isPublic', { isPublic: true })
        .andWhere('place.stateDB = :stateDB', { stateDB: true })
        .andWhere(
          `ST_DWithin(
            place.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radius
          )`,
          { latitude, longitude, radius: radiusMeters },
        )
        .orderBy('images.order', 'ASC')
        .getMany();

      places.forEach(place => {
        if (place.location && (place.location as any).coordinates) {
          const [lon, lat] = (place.location as any).coordinates;

          if (typeof lat === 'number' && typeof lon === 'number' &&
              !isNaN(lat) && !isNaN(lon) &&
              lat !== 0 && lon !== 0) {
            const distance = this.calculateDistance(latitude, longitude, lat, lon);

            allPlaces.push({
              id: place.id,
              name: place.name,
              type: 'place',
              latitude: lat,
              longitude: lon,
              address: place.googleMapsUrl || null,
              image: place.images?.[0]?.imageResource?.url || null,
              slug: place.slug,
              distance,
            });
          }
        }
      });
    }

    // Ordenar por distancia (más cercanos primero)
    return allPlaces.sort((a, b) => a.distance - b.distance);
  }
}
