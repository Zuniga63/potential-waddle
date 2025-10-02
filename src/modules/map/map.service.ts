import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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
  private readonly googleApiKey: string;

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
    private readonly configService: ConfigService,
  ) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY') || '';
  }

  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula Haversine
   * (distancia en línea recta - usada para filtrar candidatos)
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
   * Calcula distancias reales por carretera usando Google Routes API
   * @param origin Coordenadas de origen (lat,lng)
   * @param destinations Array de coordenadas de destino [{lat, lng}]
   * @returns Map de distancias en metros por ID
   */
  private async calculateRoadDistances(
    origin: { lat: number; lng: number },
    destinations: Array<{ lat: number; lng: number; id: string }>,
  ): Promise<Map<string, number>> {
    if (destinations.length === 0) {
      return new Map();
    }

    const distanceMap = new Map<string, number>();

    // Procesar cada destino individualmente con Routes API
    for (const destination of destinations) {
      try {
        const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;

        const requestBody = {
          origin: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng,
              },
            },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_UNAWARE',
          computeAlternativeRoutes: false,
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.googleApiKey,
            'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        console.log(`  🔍 Response for ${destination.id}:`, JSON.stringify(data).substring(0, 200));

        if (data.routes && data.routes.length > 0 && data.routes[0].distanceMeters) {
          const distanceMeters = data.routes[0].distanceMeters;
          distanceMap.set(destination.id, distanceMeters);
          console.log(`  📏 Road distance to ${destination.id}: ${distanceMeters}m (${(distanceMeters / 1000).toFixed(1)} km)`);
        } else {
          // Si no hay ruta por carretera, usar distancia en línea recta
          const straightDistance = this.calculateDistance(
            origin.lat,
            origin.lng,
            destination.lat,
            destination.lng,
          );
          distanceMap.set(destination.id, straightDistance);
          console.log(`  📏 No road route for ${destination.id}, using straight line: ${straightDistance}m`);
          if (data.error) {
            console.log(`    ❌ API Error: ${data.error.message || data.error.status}`);
          }
        }

        // Pequeño delay para no exceder rate limits (100 requests por segundo)
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`❌ Error calculating route for ${destination.id}:`, error.message);
        // Fallback a distancia en línea recta
        const straightDistance = this.calculateDistance(
          origin.lat,
          origin.lng,
          destination.lat,
          destination.lng,
        );
        distanceMap.set(destination.id, straightDistance);
      }
    }

    return distanceMap;
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
    console.log('🔍 getNearbyPlaces called with:', { latitude, longitude, radiusKm, types });

    const radiusMeters = radiusKm * 1000;
    const allPlaces: NearbyPlace[] = [];

    // Determinar qué tipos buscar
    const typesToSearch = types && types.length > 0 ? types : [
      'lodging',
      'restaurant',
      'place',
    ];

    console.log('📍 Search parameters:', { radiusMeters, typesToSearch });

    // Buscar Lodgings
    if (typesToSearch.includes('lodging')) {
      console.log('🏨 Searching for lodgings...');
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

      console.log(`🏨 Found ${lodgings.length} lodgings from DB`);

      lodgings.forEach((lodging, index) => {
        console.log(`  🏨 Lodging ${index + 1}:`, {
          name: lodging.name,
          hasLocation: !!lodging.location,
          location: lodging.location
        });

        if (lodging.location && (lodging.location as any).coordinates) {
          const [lon, lat] = (lodging.location as any).coordinates;
          console.log(`    📍 Coordinates:`, { lat, lon });

          // Validar que las coordenadas sean números válidos
          if (typeof lat === 'number' && typeof lon === 'number' &&
              !isNaN(lat) && !isNaN(lon) &&
              lat !== 0 && lon !== 0) {
            const distance = this.calculateDistance(latitude, longitude, lat, lon);
            console.log(`    ✅ Valid! Distance: ${distance}m`);

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
          } else {
            console.log(`    ❌ Invalid coordinates:`, { lat, lon });
          }
        } else {
          console.log(`    ❌ No valid location`);
        }
      });

      console.log(`🏨 Added ${allPlaces.length} lodgings to results`);
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

    console.log(`📊 Total places found with straight-line distance: ${allPlaces.length}`);

    // Calcular distancias reales por carretera usando Google Distance Matrix API
    console.log('🚗 Calculating real road distances...');
    const destinations = allPlaces.map(p => ({
      lat: p.latitude,
      lng: p.longitude,
      id: p.id,
    }));

    const roadDistances = await this.calculateRoadDistances(
      { lat: latitude, lng: longitude },
      destinations,
    );

    // Actualizar distancias con las distancias reales por carretera
    allPlaces.forEach(place => {
      const roadDistance = roadDistances.get(place.id);
      if (roadDistance !== undefined) {
        place.distance = roadDistance;
      }
    });

    // Filtrar lugares que excedan el radio después de calcular distancia real por carretera
    const filteredPlaces = allPlaces.filter(place => place.distance <= radiusMeters);

    console.log(`🔍 Filtered ${allPlaces.length - filteredPlaces.length} places that exceeded ${radiusKm} km by road`);

    // Ordenar por distancia real (más cercanos primero)
    const sortedPlaces = filteredPlaces.sort((a, b) => a.distance - b.distance);

    console.log('✅ Final results with road distances:', {
      totalPlaces: sortedPlaces.length,
      byType: {
        lodging: sortedPlaces.filter(p => p.type === 'lodging').length,
        restaurant: sortedPlaces.filter(p => p.type === 'restaurant').length,
        place: sortedPlaces.filter(p => p.type === 'place').length,
      }
    });

    return sortedPlaces;
  }
}
