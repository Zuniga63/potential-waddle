import { Injectable } from '@nestjs/common';

/**
 * Servicio de Chunking Profesional
 *
 * Este servicio implementa estrategias de chunking optimizadas para cada tipo de entidad.
 * Cada chunk tiene:
 * - content: Texto que se vectoriza
 * - metadata: Información estructurada para filtros en Pinecone
 */

// Mapeo de dificultad numérica a texto
const DIFFICULTY_MAP: Record<number, string> = {
  1: 'muy fácil',
  2: 'fácil',
  3: 'moderado',
  4: 'difícil',
  5: 'muy difícil',
};

export type EntityType = 'lodging' | 'restaurant' | 'experience' | 'place' | 'guide' | 'transport' | 'commerce';

export interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, string | number | boolean>;
}

export interface LodgingData {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  town_name: string;
  town_id?: string;
  department?: string;
  lowest_price?: number;
  highest_price?: number;
  rating?: number;
  is_verified?: boolean;
  latitude?: number;
  longitude?: number;
  urban_center_distance?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  categories?: string;
  facilities?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RestaurantData {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  town_name: string;
  town_id?: string;
  department?: string;
  price_level?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  urban_center_distance?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  categories?: string;
  facilities?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExperienceData {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  town_name: string;
  town_id?: string;
  department?: string;
  price?: number;
  difficulty_level?: number;
  duration?: number;
  min_participants?: number;
  max_participants?: number;
  includes?: string;
  start_location_name?: string;
  start_latitude?: number;
  start_longitude?: number;
  categories?: string;
  facilities?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlaceData {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  town_name: string;
  town_id?: string;
  department?: string;
  history?: string;
  altitude?: number;
  temperature?: number;
  difficulty_level?: number;
  recommendations?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  urban_center_distance?: number;
  categories?: string;
  facilities?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GuideData {
  id: string;
  full_name: string;
  slug?: string;
  biography?: string;
  town_name?: string;
  town_id?: string;
  department?: string;
  rating?: number;
  email?: string;
  phone?: string;
  whatsapp?: string;
  languages?: string | string[];
  categories?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransportData {
  id: string;
  full_name: string;
  town_name: string;
  town_id?: string;
  department?: string;
  rating?: number;
  phone?: string;
  whatsapp?: string;
  license_plate?: string;
  categories?: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommerceData {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  town_name: string;
  town_id?: string;
  department?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  urban_center_distance?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  categories?: string;
  facilities?: string;
  services?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class ChunkingService {
  /**
   * Crear chunk para un alojamiento (hotel)
   */
  createLodgingChunk(lodging: LodgingData): ChunkResult {
    // Construir content (texto que se vectoriza)
    const contentParts = [`${lodging.name} - Alojamiento en ${lodging.town_name}, ${lodging.department || ''}`];

    if (lodging.description) {
      contentParts.push(`\nDescripción: ${lodging.description}`);
    }

    if (lodging.categories) {
      contentParts.push(`\nCategorías: ${lodging.categories}`);
    }

    if (lodging.facilities) {
      contentParts.push(`\nFacilidades: ${lodging.facilities}`);
    }

    if (lodging.address) {
      contentParts.push(`\nUbicación: ${lodging.address}`);
    }

    if (lodging.lowest_price && lodging.highest_price) {
      contentParts.push(
        `\nRango de precios: $${lodging.lowest_price.toLocaleString()} - $${lodging.highest_price.toLocaleString()} COP por noche`,
      );
    }

    if (lodging.rating) {
      contentParts.push(`\nCalificación: ${lodging.rating}/5 estrellas`);
    }

    const content = contentParts.join('');

    // Construir metadata (no se vectoriza, pero se usa para filtros)
    const metadata: Record<string, string | number | boolean> = {
      entity_type: 'lodging',
      entity_id: String(lodging.id),
      name: lodging.name,
      slug: lodging.slug || '',
      town: lodging.town_name,
      town_id: String(lodging.town_id || ''),
      department: lodging.department || '',
      price_min: Number(lodging.lowest_price) || 0,
      price_max: Number(lodging.highest_price) || 0,
      currency: 'COP',
      rating: Number(lodging.rating) || 0,
      is_verified: Boolean(lodging.is_verified),
      latitude: Number(lodging.latitude) || 0,
      longitude: Number(lodging.longitude) || 0,
      urban_center_distance: Number(lodging.urban_center_distance) || 0,
      phone: lodging.phone || '',
      whatsapp: lodging.whatsapp || '',
      email: lodging.email || '',
      categories: lodging.categories || '',
      facilities: lodging.facilities || '',
      searchable_text: `${lodging.name} ${lodging.description || ''} ${lodging.categories || ''} ${lodging.facilities || ''} ${lodging.town_name} alojamiento hotel`,
      created_at: String(lodging.created_at || ''),
      updated_at: String(lodging.updated_at || ''),
    };

    return {
      id: `lodging_${lodging.id}`,
      content,
      metadata,
    };
  }

  /**
   * Crear chunk para un restaurante
   */
  createRestaurantChunk(restaurant: RestaurantData): ChunkResult {
    const contentParts = [
      `${restaurant.name} - Restaurante en ${restaurant.town_name}, ${restaurant.department || ''}`,
    ];

    if (restaurant.description) {
      contentParts.push(`\nDescripción: ${restaurant.description}`);
    }

    if (restaurant.categories) {
      contentParts.push(`\nCategorías: ${restaurant.categories}`);
    }

    if (restaurant.facilities) {
      contentParts.push(`\nFacilidades: ${restaurant.facilities}`);
    }

    if (restaurant.price_level) {
      contentParts.push(`\nNivel de precios: ${restaurant.price_level}`);
    }

    if (restaurant.address) {
      contentParts.push(`\nUbicación: ${restaurant.address}`);
    }

    if (restaurant.rating) {
      contentParts.push(`\nCalificación: ${restaurant.rating}/5 estrellas`);
    }

    const content = contentParts.join('');

    const metadata: Record<string, string | number | boolean> = {
      entity_type: 'restaurant',
      entity_id: String(restaurant.id),
      name: restaurant.name,
      slug: restaurant.slug || '',
      town: restaurant.town_name,
      town_id: String(restaurant.town_id || ''),
      department: restaurant.department || '',
      price_level: restaurant.price_level || '',
      rating: Number(restaurant.rating) || 0,
      latitude: Number(restaurant.latitude) || 0,
      longitude: Number(restaurant.longitude) || 0,
      urban_center_distance: Number(restaurant.urban_center_distance) || 0,
      phone: restaurant.phone || '',
      whatsapp: restaurant.whatsapp || '',
      email: restaurant.email || '',
      categories: restaurant.categories || '',
      facilities: restaurant.facilities || '',
      searchable_text: `${restaurant.name} ${restaurant.description || ''} ${restaurant.categories || ''} ${restaurant.facilities || ''} ${restaurant.town_name} restaurante comida`,
      created_at: String(restaurant.created_at || ''),
      updated_at: String(restaurant.updated_at || ''),
    };

    return {
      id: `restaurant_${restaurant.id}`,
      content,
      metadata,
    };
  }

  /**
   * Crear chunk para una experiencia turística
   */
  createExperienceChunk(experience: ExperienceData): ChunkResult {
    const contentParts = [
      `${experience.title} - Experiencia turística en ${experience.town_name}, ${experience.department || ''}`,
    ];

    if (experience.description) {
      contentParts.push(`\nDescripción: ${experience.description}`);
    }

    if (experience.categories) {
      contentParts.push(`\nCategorías: ${experience.categories}`);
    }

    if (experience.facilities) {
      contentParts.push(`\nFacilidades: ${experience.facilities}`);
    }

    if (experience.difficulty_level) {
      const difficultyText = DIFFICULTY_MAP[experience.difficulty_level] || 'moderado';
      contentParts.push(`\nDificultad: ${difficultyText}`);
    }

    if (experience.duration) {
      contentParts.push(`\nDuración: ${experience.duration} horas`);
    }

    if (experience.price) {
      contentParts.push(`\nPrecio: $${experience.price.toLocaleString()} COP por persona`);
    }

    if (experience.min_participants && experience.max_participants) {
      contentParts.push(`\nParticipantes: ${experience.min_participants} - ${experience.max_participants} personas`);
    }

    if (experience.includes) {
      contentParts.push(`\nIncluye: ${experience.includes}`);
    }

    if (experience.start_location_name) {
      contentParts.push(`\nPunto de partida: ${experience.start_location_name}`);
    }

    const content = contentParts.join('');

    const metadata: Record<string, string | number | boolean> = {
      entity_type: 'experience',
      entity_id: String(experience.id),
      title: experience.title,
      slug: experience.slug || '',
      town: experience.town_name,
      town_id: String(experience.town_id || ''),
      department: experience.department || '',
      price: Number(experience.price) || 0,
      currency: 'COP',
      difficulty_level: Number(experience.difficulty_level) || 3,
      difficulty_text: DIFFICULTY_MAP[experience.difficulty_level || 3] || 'moderado',
      duration_hours: Number(experience.duration) || 0,
      min_participants: Number(experience.min_participants) || 1,
      max_participants: Number(experience.max_participants) || 20,
      start_latitude: Number(experience.start_latitude) || 0,
      start_longitude: Number(experience.start_longitude) || 0,
      categories: experience.categories || '',
      facilities: experience.facilities || '',
      searchable_text: `${experience.title} ${experience.description || ''} ${experience.categories || ''} ${experience.facilities || ''} ${experience.town_name} experiencia tour actividad`,
      created_at: String(experience.created_at || ''),
      updated_at: String(experience.updated_at || ''),
    };

    return {
      id: `experience_${experience.id}`,
      content,
      metadata,
    };
  }

  /**
   * Crear chunk para un lugar mágico
   */
  createPlaceChunk(place: PlaceData): ChunkResult {
    const contentParts = [`${place.name} - Lugar mágico en ${place.town_name}, ${place.department || ''}`];

    if (place.description) {
      contentParts.push(`\nDescripción: ${place.description}`);
    }

    if (place.categories) {
      contentParts.push(`\nCategorías: ${place.categories}`);
    }

    if (place.facilities) {
      contentParts.push(`\nFacilidades: ${place.facilities}`);
    }

    if (place.history) {
      contentParts.push(`\nHistoria: ${place.history}`);
    }

    if (place.altitude) {
      contentParts.push(`\nAltitud: ${place.altitude}m sobre el nivel del mar`);
    }

    if (place.temperature) {
      contentParts.push(`\nTemperatura promedio: ${place.temperature}°C`);
    }

    if (place.difficulty_level) {
      const difficultyText = DIFFICULTY_MAP[place.difficulty_level] || 'moderado';
      contentParts.push(`\nDificultad de acceso: ${difficultyText}`);
    }

    if (place.recommendations) {
      contentParts.push(`\nRecomendaciones: ${place.recommendations}`);
    }

    if (place.rating) {
      contentParts.push(`\nCalificación: ${place.rating}/5 estrellas`);
    }

    const content = contentParts.join('');

    const metadata: Record<string, string | number | boolean> = {
      entity_type: 'place',
      entity_id: String(place.id),
      name: place.name,
      slug: place.slug || '',
      town: place.town_name,
      town_id: String(place.town_id || ''),
      department: place.department || '',
      altitude: Number(place.altitude) || 0,
      temperature: Number(place.temperature) || 0,
      difficulty_level: Number(place.difficulty_level) || 3,
      difficulty_text: DIFFICULTY_MAP[place.difficulty_level || 3] || 'moderado',
      rating: Number(place.rating) || 0,
      latitude: Number(place.latitude) || 0,
      longitude: Number(place.longitude) || 0,
      urban_center_distance: Number(place.urban_center_distance) || 0,
      categories: place.categories || '',
      facilities: place.facilities || '',
      searchable_text: `${place.name} ${place.description || ''} ${place.history || ''} ${place.categories || ''} ${place.facilities || ''} ${place.town_name} lugar mágico atractivo turístico`,
      created_at: String(place.created_at || ''),
      updated_at: String(place.updated_at || ''),
    };

    return {
      id: `place_${place.id}`,
      content,
      metadata,
    };
  }

  /**
   * Crear chunk para un guía turístico
   */
  createGuideChunk(guide: GuideData): ChunkResult {
    const contentParts = [
      `${guide.full_name} - Guía turístico en ${guide.town_name || 'Colombia'}, ${guide.department || ''}`,
    ];

    if (guide.biography) {
      contentParts.push(`\nBiografía: ${guide.biography}`);
    }

    if (guide.categories) {
      contentParts.push(`\nEspecialidades: ${guide.categories}`);
    }

    if (guide.languages) {
      const languages = Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages;
      contentParts.push(`\nIdiomas: ${languages}`);
    }

    if (guide.rating) {
      contentParts.push(`\nCalificación: ${guide.rating}/5 estrellas`);
    }

    const content = contentParts.join('');

    const metadata: Record<string, string | number | boolean> = {
      entity_type: 'guide',
      entity_id: String(guide.id),
      name: guide.full_name,
      slug: guide.slug || '',
      town: guide.town_name || '',
      town_id: String(guide.town_id || ''),
      department: guide.department || '',
      rating: Number(guide.rating) || 0,
      email: guide.email || '',
      phone: guide.phone || '',
      whatsapp: guide.whatsapp || '',
      categories: guide.categories || '',
      searchable_text: `${guide.full_name} ${guide.biography || ''} ${guide.categories || ''} ${guide.town_name || ''} guía turístico tour`,
      created_at: String(guide.created_at || ''),
      updated_at: String(guide.updated_at || ''),
    };

    return {
      id: `guide_${guide.id}`,
      content,
      metadata,
    };
  }

  /**
   * Crear chunk para un transportista
   */
  createTransportChunk(transport: TransportData): ChunkResult {
    const contentParts = [
      `${transport.full_name} - Transportista en ${transport.town_name}, ${transport.department || ''}`,
    ];

    if (transport.categories) {
      contentParts.push(`\nTipo de servicio: ${transport.categories}`);
    }

    if (transport.start_time && transport.end_time) {
      contentParts.push(`\nHorario: ${transport.start_time} - ${transport.end_time}`);
    }

    if (transport.rating) {
      contentParts.push(`\nCalificación: ${transport.rating}/5 estrellas`);
    }

    const content = contentParts.join('');

    const metadata: Record<string, string | number | boolean> = {
      entity_type: 'transport',
      entity_id: String(transport.id),
      name: transport.full_name,
      town: transport.town_name,
      town_id: String(transport.town_id || ''),
      department: transport.department || '',
      rating: Number(transport.rating) || 0,
      phone: transport.phone || '',
      whatsapp: transport.whatsapp || '',
      license_plate: transport.license_plate || '',
      categories: transport.categories || '',
      searchable_text: `${transport.full_name} ${transport.categories || ''} ${transport.town_name} transportista transporte`,
      created_at: String(transport.created_at || ''),
      updated_at: String(transport.updated_at || ''),
    };

    return {
      id: `transport_${transport.id}`,
      content,
      metadata,
    };
  }

  /**
   * Crear chunk para un comercio
   */
  createCommerceChunk(commerce: CommerceData): ChunkResult {
    const contentParts = [`${commerce.name} - Comercio en ${commerce.town_name}, ${commerce.department || ''}`];

    if (commerce.description) {
      contentParts.push(`\nDescripción: ${commerce.description}`);
    }

    if (commerce.categories) {
      contentParts.push(`\nCategorías: ${commerce.categories}`);
    }

    if (commerce.facilities) {
      contentParts.push(`\nFacilidades: ${commerce.facilities}`);
    }

    if (commerce.services) {
      contentParts.push(`\nServicios: ${commerce.services}`);
    }

    if (commerce.address) {
      contentParts.push(`\nUbicación: ${commerce.address}`);
    }

    if (commerce.rating) {
      contentParts.push(`\nCalificación: ${commerce.rating}/5 estrellas`);
    }

    const content = contentParts.join('');

    const metadata: Record<string, string | number | boolean> = {
      entity_type: 'commerce',
      entity_id: String(commerce.id),
      name: commerce.name,
      slug: commerce.slug || '',
      town: commerce.town_name,
      town_id: String(commerce.town_id || ''),
      department: commerce.department || '',
      rating: Number(commerce.rating) || 0,
      latitude: Number(commerce.latitude) || 0,
      longitude: Number(commerce.longitude) || 0,
      urban_center_distance: Number(commerce.urban_center_distance) || 0,
      phone: commerce.phone || '',
      whatsapp: commerce.whatsapp || '',
      email: commerce.email || '',
      categories: commerce.categories || '',
      facilities: commerce.facilities || '',
      services: commerce.services || '',
      searchable_text: `${commerce.name} ${commerce.description || ''} ${commerce.categories || ''} ${commerce.facilities || ''} ${commerce.services || ''} ${commerce.town_name} comercio tienda`,
      created_at: String(commerce.created_at || ''),
      updated_at: String(commerce.updated_at || ''),
    };

    return {
      id: `commerce_${commerce.id}`,
      content,
      metadata,
    };
  }
}
