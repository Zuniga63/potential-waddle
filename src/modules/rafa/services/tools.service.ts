import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lodging } from 'src/modules/lodgings/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Place } from 'src/modules/places/entities';
import { Guide } from 'src/modules/guides/entities/guide.entity';
import { Transport } from 'src/modules/transport/entities/transport.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { Town } from 'src/modules/towns/entities';
import { VectorizationService } from 'src/modules/pinecone/vectorization.service';

import { TripState } from '../dto/trip-state.dto';
import { ChatCard, CardType, EntityCardData, EntityImage } from '../dto/chat.dto';
import { ToolName } from '../dto/intent-config';

interface SearchFilters {
  townId?: string;
  budgetMin?: number;
  budgetMax?: number;
  tags?: string[];
  limit?: number;
}

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  constructor(
    @InjectRepository(Lodging) private lodgingRepo: Repository<Lodging>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Experience) private experienceRepo: Repository<Experience>,
    @InjectRepository(Place) private placeRepo: Repository<Place>,
    @InjectRepository(Guide) private guideRepo: Repository<Guide>,
    @InjectRepository(Transport) private transportRepo: Repository<Transport>,
    @InjectRepository(Commerce) private commerceRepo: Repository<Commerce>,
    @InjectRepository(Town) private townRepo: Repository<Town>,
    private readonly vectorizationService: VectorizationService,
  ) {}

  async executeTool(
    toolName: ToolName,
    state: TripState,
    userMessage: string,
    extractedData?: { selectedPosition?: number; selectedName?: string },
  ): Promise<ChatCard[]> {
    const filters = this.buildFilters(state);

    switch (toolName) {
      case 'searchLodgings':
        return this.searchLodgings(filters);
      case 'searchRestaurants':
        return this.searchRestaurants(filters);
      case 'searchExperiences':
        return this.searchExperiences(filters);
      case 'searchPlaces':
        return this.searchPlaces(filters);
      case 'searchGuides':
        return this.searchGuides(filters);
      case 'searchTransport':
        return this.searchTransport(filters);
      case 'searchCommerce':
        return this.searchCommerce(filters);
      case 'ragSearch':
        return this.ragSearch(userMessage, state.townId ?? undefined);
      case 'selectEntity':
        return this.selectEntity(
          state,
          extractedData?.selectedPosition ?? undefined,
          extractedData?.selectedName ?? undefined,
          userMessage,
        );
      default:
        this.logger.warn(`Unknown tool: ${toolName}`);
        return [];
    }
  }

  private buildFilters(state: TripState): SearchFilters {
    return {
      townId: state.townId ?? undefined,
      budgetMin: state.budgetMin ?? undefined,
      budgetMax: state.budgetMax ?? undefined,
      tags: state.tags.length > 0 ? state.tags : undefined,
      limit: 5,
    };
  }

  // =============================================
  // LODGINGS
  // =============================================
  async searchLodgings(filters: SearchFilters): Promise<ChatCard[]> {
    let qb = this.lodgingRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.town', 'town')
      .leftJoinAndSelect('l.images', 'images')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .leftJoinAndSelect('l.categories', 'categories')
      .where('l.isPublic = true')
      .andWhere('l.stateDB = true');

    if (filters.townId) {
      qb = qb.andWhere('town.id = :townId', { townId: filters.townId });
    }

    if (filters.budgetMax) {
      qb = qb.andWhere('l.lowestPrice <= :budgetMax', { budgetMax: filters.budgetMax });
    }

    if (filters.budgetMin) {
      qb = qb.andWhere('(l.highestPrice >= :budgetMin OR l.lowestPrice >= :budgetMin)', {
        budgetMin: filters.budgetMin,
      });
    }

    qb = qb.orderBy('l.rating', 'DESC').addOrderBy('l.reviewCount', 'DESC').take(filters.limit || 5);

    const lodgings = await qb.getMany();
    return lodgings.map(l => this.mapLodgingToCard(l));
  }

  private mapLodgingToCard(l: Lodging): ChatCard {
    const images: EntityImage[] = l.images?.map(img => ({
      imageResource: img.imageResource ? { url: img.imageResource.url } : undefined,
    })) || [];

    const data: EntityCardData = {
      id: l.id,
      name: l.name,
      slug: l.slug,
      images,
      rating: l.rating || 0,
      reviewCount: l.reviewCount || 0,
      googleMapsRating: l.googleMapsRating || undefined,
      googleMapsReviewsCount: l.googleMapsReviewsCount || undefined,
      address: l.address || undefined,
      whatsappNumbers: l.whatsappNumbers || [],
      phoneNumbers: l.phoneNumbers || [],
      lowestPrice: l.lowestPrice ? String(l.lowestPrice) : undefined,
      highestPrice: l.highestPrice ? String(l.highestPrice) : undefined,
      urbanCenterDistance: l.urbanCenterDistance || undefined,
      googleMapsUrl: l.googleMapsUrl || undefined,
      description: l.description || undefined,
      town: l.town ? { id: l.town.id, name: l.town.name, slug: l.town.id } : undefined,
      categories: l.categories?.map(c => ({ id: c.id, name: c.name })) || [],
    };

    return {
      id: l.id,
      type: 'lodging',
      title: l.name,
      subtitle: l.town?.name,
      data,
      actions: [
        { text: 'Ver detalles', action: `view_details_${l.id}` },
        { text: 'Solicitar cotización', action: `request_quote_${l.id}` },
      ],
    };
  }

  // =============================================
  // RESTAURANTS
  // =============================================
  async searchRestaurants(filters: SearchFilters): Promise<ChatCard[]> {
    let qb = this.restaurantRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.town', 'town')
      .leftJoinAndSelect('r.images', 'images')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .leftJoinAndSelect('r.categories', 'categories')
      .where('r.isPublic = true')
      .andWhere('r.stateDB = true');

    if (filters.townId) {
      qb = qb.andWhere('town.id = :townId', { townId: filters.townId });
    }

    qb = qb.orderBy('r.rating', 'DESC').addOrderBy('r.reviewCount', 'DESC').take(filters.limit || 5);

    const restaurants = await qb.getMany();
    return restaurants.map(r => this.mapRestaurantToCard(r));
  }

  private mapRestaurantToCard(r: Restaurant): ChatCard {
    // Frontend expects direct URL strings for restaurants
    const images: EntityImage[] = r.images?.map(img => ({
      url: img.imageResource?.url,
      imageResource: img.imageResource ? { url: img.imageResource.url } : undefined,
    })) || [];

    const data: EntityCardData = {
      id: r.id,
      name: r.name,
      slug: r.slug,
      images,
      rating: r.rating || 0,
      reviewCount: r.reviewCount || 0,
      googleMapsRating: r.googleMapsRating || undefined,
      googleMapsReviewsCount: r.googleMapsReviewsCount || undefined,
      address: r.address || undefined,
      whatsappNumbers: r.whatsappNumbers || [],
      phoneNumbers: r.phoneNumbers || [],
      urbanCenterDistance: r.urbanCenterDistance || undefined,
      googleMapsUrl: r.googleMapsUrl || undefined,
      description: r.description || undefined,
      town: r.town ? { id: r.town.id, name: r.town.name, slug: r.town.id } : undefined,
      categories: r.categories?.map(c => ({ id: c.id, name: c.name })) || [],
    };

    return {
      id: r.id,
      type: 'restaurant',
      title: r.name,
      subtitle: r.town?.name,
      data,
      actions: [
        { text: 'Ver detalles', action: `view_details_${r.id}` },
        { text: 'Ver menú', action: `view_menu_${r.id}` },
      ],
    };
  }

  // =============================================
  // EXPERIENCES
  // =============================================
  async searchExperiences(filters: SearchFilters): Promise<ChatCard[]> {
    let qb = this.experienceRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.town', 'town')
      .leftJoinAndSelect('e.images', 'images')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .leftJoinAndSelect('e.categories', 'categories')
      .where('e.isPublic = true');

    if (filters.townId) {
      qb = qb.andWhere('town.id = :townId', { townId: filters.townId });
    }

    qb = qb.orderBy('e.rating', 'DESC').addOrderBy('e.reviewsCount', 'DESC').take(filters.limit || 5);

    const experiences = await qb.getMany();
    return experiences.map(e => this.mapExperienceToCard(e));
  }

  private mapExperienceToCard(e: Experience): ChatCard {
    // Frontend expects URL strings for experiences
    const images: EntityImage[] = e.images?.map(img => ({
      url: img.imageResource?.url,
      imageResource: img.imageResource ? { url: img.imageResource.url } : undefined,
    })) || [];

    const coords = e.departureLocation?.coordinates || [0, 0];

    const data: EntityCardData = {
      id: e.id,
      title: e.title, // Experiences use 'title' not 'name'
      slug: e.slug,
      images,
      rating: e.rating || 0,
      reviews: e.reviewsCount || 0,
      price: e.price ? Number(e.price) : undefined,
      difficultyLevel: Number(e.difficultyLevel) || undefined,
      departure: {
        latitude: coords[1],
        longitude: coords[0],
        description: e.departureDescription || '',
      },
      description: e.description || undefined,
      town: e.town ? { id: e.town.id, name: e.town.name, slug: e.town.id } : undefined,
      categories: e.categories?.map(c => ({ id: c.id, name: c.name })) || [],
    };

    return {
      id: e.id,
      type: 'experience',
      title: e.title,
      subtitle: e.town?.name,
      data,
      actions: [
        { text: 'Ver detalles', action: `view_details_${e.id}` },
        { text: 'Reservar', action: `book_experience_${e.id}` },
      ],
    };
  }

  // =============================================
  // PLACES
  // =============================================
  async searchPlaces(filters: SearchFilters): Promise<ChatCard[]> {
    let qb = this.placeRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.town', 'town')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .leftJoinAndSelect('p.categories', 'categories')
      .where('p.isPublic = true')
      .andWhere('p.stateDB = true');

    if (filters.townId) {
      qb = qb.andWhere('town.id = :townId', { townId: filters.townId });
    }

    qb = qb.orderBy('p.rating', 'DESC').addOrderBy('p.reviewCount', 'DESC').take(filters.limit || 5);

    const places = await qb.getMany();
    return places.map(p => this.mapPlaceToCard(p));
  }

  private mapPlaceToCard(p: Place): ChatCard {
    const images: EntityImage[] = p.images?.map(img => ({
      imageResource: img.imageResource ? { url: img.imageResource.url } : undefined,
    })) || [];

    const coords = p.location?.coordinates || [0, 0];

    const data: EntityCardData = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      images,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      latitude: coords[1],
      longitude: coords[0],
      urbanCenterDistance: p.urbarCenterDistance || undefined,
      description: p.description || undefined,
      town: p.town ? { id: p.town.id, name: p.town.name, slug: p.town.id } : undefined,
      categories: p.categories?.map(c => ({ id: c.id, name: c.name })) || [],
    };

    return {
      id: p.id,
      type: 'place',
      title: p.name,
      subtitle: p.town?.name,
      data,
      actions: [
        { text: 'Ver detalles', action: `view_details_${p.id}` },
        { text: 'Cómo llegar', action: `directions_${p.id}` },
      ],
    };
  }

  // =============================================
  // GUIDES
  // =============================================
  async searchGuides(filters: SearchFilters): Promise<ChatCard[]> {
    let qb = this.guideRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.town', 'town')
      .leftJoinAndSelect('g.images', 'images')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .leftJoinAndSelect('g.categories', 'categories')
      .where('g.isPublic = true');

    if (filters.townId) {
      qb = qb.andWhere('town.id = :townId', { townId: filters.townId });
    }

    qb = qb.orderBy('g.rating', 'DESC').take(filters.limit || 5);

    const guides = await qb.getMany();
    return guides.map(g => this.mapGuideToCard(g));
  }

  private mapGuideToCard(g: Guide): ChatCard {
    const images: EntityImage[] = g.images?.map(img => ({
      imageResource: img.imageResource ? { url: img.imageResource.url } : undefined,
    })) || [];

    const fullName = `${g.firstName} ${g.lastName}`;

    const data: EntityCardData = {
      id: g.id,
      name: fullName,
      slug: g.slug,
      images,
      rating: g.rating || 0,
      reviewCount: g.reviewCount || 0,
      firstName: g.firstName,
      lastName: g.lastName,
      languages: g.languages || [],
      biography: g.biography || undefined,
      whatsappNumbers: g.whatsapp ? [g.whatsapp] : [],
      phoneNumbers: g.phone ? [g.phone] : [],
      towns: g.towns?.map(t => ({ id: t.id, name: t.name, slug: t.id })) || [],
      categories: g.categories?.map(c => ({ id: c.id, name: c.name })) || [],
    };

    const primaryTown = g.towns?.[0];
    return {
      id: g.id,
      type: 'guide',
      title: fullName,
      subtitle: primaryTown?.name,
      data,
      actions: [
        { text: 'Ver perfil', action: `view_details_${g.id}` },
        { text: 'Contactar', action: `contact_guide_${g.id}` },
      ],
    };
  }

  // =============================================
  // TRANSPORT
  // =============================================
  async searchTransport(filters: SearchFilters): Promise<ChatCard[]> {
    let qb = this.transportRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.town', 'town')
      .leftJoinAndSelect('t.categories', 'categories')
      .where('t.isPublic = true');

    if (filters.townId) {
      qb = qb.andWhere('town.id = :townId', { townId: filters.townId });
    }

    qb = qb.orderBy('t.rating', 'DESC').take(filters.limit || 5);

    const transports = await qb.getMany();
    return transports.map(t => this.mapTransportToCard(t));
  }

  private mapTransportToCard(t: Transport): ChatCard {
    const fullName = `${t.firstName} ${t.lastName}`;

    const data: EntityCardData = {
      id: t.id,
      name: fullName,
      slug: t.id, // Transport doesn't have slug
      images: [],
      rating: t.rating || 0,
      reviewCount: t.reviewCount || 0,
      firstName: t.firstName,
      lastName: t.lastName,
      licensePlate: t.licensePlate,
      whatsappNumbers: t.whatsapp ? [t.whatsapp] : [],
      phoneNumbers: t.phone ? [t.phone] : [],
      town: t.town ? { id: t.town.id, name: t.town.name, slug: t.town.id } : undefined,
      categories: t.categories?.map(c => ({ id: c.id, name: c.name })) || [],
    };

    return {
      id: t.id,
      type: 'transport',
      title: fullName,
      subtitle: `Placa: ${t.licensePlate}`,
      data,
      actions: [
        { text: 'Contactar', action: `contact_transport_${t.id}` },
      ],
    };
  }

  // =============================================
  // COMMERCE
  // =============================================
  async searchCommerce(filters: SearchFilters): Promise<ChatCard[]> {
    let qb = this.commerceRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.town', 'town')
      .leftJoinAndSelect('c.images', 'images')
      .leftJoinAndSelect('images.imageResource', 'imageResource')
      .leftJoinAndSelect('c.categories', 'categories')
      .where('c.isPublic = true')
      .andWhere('c.stateDB = true');

    if (filters.townId) {
      qb = qb.andWhere('town.id = :townId', { townId: filters.townId });
    }

    qb = qb.orderBy('c.rating', 'DESC').take(filters.limit || 5);

    const commerces = await qb.getMany();
    return commerces.map(c => this.mapCommerceToCard(c));
  }

  private mapCommerceToCard(c: Commerce): ChatCard {
    const images: EntityImage[] = c.images?.map(img => ({
      imageResource: img.imageResource ? { url: img.imageResource.url } : undefined,
    })) || [];

    const data: EntityCardData = {
      id: c.id,
      name: c.name,
      slug: c.slug,
      images,
      rating: c.rating || 0,
      reviewCount: c.reviewCount || 0,
      googleMapsRating: c.googleMapsRating || undefined,
      address: c.address || undefined,
      whatsappNumbers: c.whatsappNumbers || [],
      phoneNumbers: c.phoneNumbers || [],
      urbanCenterDistance: c.urbanCenterDistance || undefined,
      googleMapsUrl: c.googleMapsUrl || undefined,
      description: c.description || undefined,
      town: c.town ? { id: c.town.id, name: c.town.name, slug: c.town.id } : undefined,
      categories: c.categories?.map(cat => ({ id: cat.id, name: cat.name })) || [],
    };

    return {
      id: c.id,
      type: 'commerce',
      title: c.name,
      subtitle: c.town?.name,
      data,
      actions: [
        { text: 'Ver detalles', action: `view_details_${c.id}` },
      ],
    };
  }

  // =============================================
  // RAG SEARCH
  // =============================================
  async ragSearch(query: string, townId?: string): Promise<ChatCard[]> {
    try {
      // TEMP: Use production San Rafael namespace until IDs are synced
      const PROD_SAN_RAFAEL_NAMESPACE = '3651a959-fb3f-40d3-a455-50004d69e48b';

      this.logger.debug(`RAG Search - query: "${query}" (namespace: ${PROD_SAN_RAFAEL_NAMESPACE})`);

      const results = await this.vectorizationService.search(query, {
        topK: 5,
        townId: PROD_SAN_RAFAEL_NAMESPACE, // Hardcoded prod namespace
      });

      this.logger.debug(`RAG Search - found ${results.length} results`);

      // Filter by score threshold and smart selection
      const MIN_SCORE = 0.35;
      const HIGH_SCORE = 0.5;

      let filteredResults = results.filter(r => (r.score || 0) >= MIN_SCORE);

      // If top result has high score and is significantly better than #2, only show top result
      if (filteredResults.length > 1 && (filteredResults[0].score || 0) >= HIGH_SCORE) {
        const topScore = filteredResults[0].score || 0;
        const secondScore = filteredResults[1].score || 0;
        // If top is 30%+ better than second, it's a specific query - show only top
        if (topScore > secondScore * 1.3) {
          this.logger.debug(`RAG: Top result is significantly better, showing only top result`);
          filteredResults = [filteredResults[0]];
        }
      }

      // Hydrate results with full entity data from DB
      const hydratedCards: ChatCard[] = [];

      for (const r of filteredResults) {
        const metadata = r.metadata as Record<string, unknown>;
        const entityId = (metadata?.entity_id as string) || r.id;
        const entityType = metadata?.entity_type as string;

        this.logger.debug(`RAG result: ${metadata?.name || entityId} (score: ${r.score}, type: ${entityType})`);

        // Fetch full entity from DB
        const card = await this.fetchSingleEntity(entityType, entityId);
        if (card.length > 0) {
          hydratedCards.push(card[0]);
        } else {
          // Fallback to basic card if entity not found in local DB
          hydratedCards.push({
            id: entityId,
            type: (entityType as CardType) || 'entity_card',
            title: (metadata?.name as string) || (metadata?.title as string) || `Resultado`,
            subtitle: metadata?.town as string,
            content: {
              description: ((metadata?.searchable_text as string) || '').substring(0, 200),
              entity_type: entityType,
            },
            actions: [
              { text: 'Ver más', action: `view_details_${entityId}` },
            ],
          });
        }
      }

      return hydratedCards;
    } catch (error) {
      this.logger.error(`RAG search error: ${error.message}`);
      return [];
    }
  }

  // =============================================
  // SELECT ENTITY
  // =============================================
  async selectEntity(
    state: TripState,
    selectedPosition?: number,
    selectedName?: string,
    userMessage?: string,
  ): Promise<ChatCard[]> {
    if (!state.lastResults || state.lastResults.items.length === 0) {
      return [];
    }

    const items = state.lastResults.items;
    const entityType = state.lastResults.entityType;
    let selectedId: string | null = null;

    // 1. Check if user selected by position (e.g., "el primero", "la segunda opción")
    if (selectedPosition && selectedPosition >= 1 && selectedPosition <= items.length) {
      selectedId = items[selectedPosition - 1].id;
    }

    // 2. Check if user selected by name
    if (!selectedId && selectedName) {
      const found = items.find(item =>
        item.name.toLowerCase().includes(selectedName.toLowerCase())
      );
      if (found) selectedId = found.id;
    }

    // 3. Check for superlatives in user message
    if (!selectedId && userMessage) {
      const msgLower = userMessage.toLowerCase();

      if (msgLower.includes('más costoso') || msgLower.includes('más caro') || msgLower.includes('el caro')) {
        // Need to fetch the actual entity to compare prices
        selectedId = await this.findByPriceCriteria(entityType, items.map(i => i.id), 'highest');
      } else if (msgLower.includes('más barato') || msgLower.includes('más económico') || msgLower.includes('el barato')) {
        selectedId = await this.findByPriceCriteria(entityType, items.map(i => i.id), 'lowest');
      } else if (msgLower.includes('mejor valorado') || msgLower.includes('mejor rating') || msgLower.includes('mejor calificado')) {
        selectedId = await this.findByRatingCriteria(entityType, items.map(i => i.id));
      }
    }

    // If we found a selected entity, fetch and return just that one
    if (selectedId) {
      return this.fetchSingleEntity(entityType, selectedId);
    }

    // Default: return all items as before (user can pick)
    return items.map(item => ({
      id: item.id,
      type: entityType as CardType,
      title: item.name,
      actions: [
        { text: 'Seleccionar', action: `select_${item.id}` },
      ],
    }));
  }

  private async findByPriceCriteria(
    entityType: string,
    ids: string[],
    criteria: 'highest' | 'lowest',
  ): Promise<string | null> {
    if (entityType === 'lodging') {
      const lodgings = await this.lodgingRepo.findByIds(ids);
      const sorted = lodgings.sort((a, b) => {
        const priceA = criteria === 'highest' ? (b.highestPrice || b.lowestPrice || 0) : (a.lowestPrice || 0);
        const priceB = criteria === 'highest' ? (a.highestPrice || a.lowestPrice || 0) : (b.lowestPrice || 0);
        return priceB - priceA;
      });
      return sorted[0]?.id || null;
    }
    // Add other entity types as needed
    return null;
  }

  private async findByRatingCriteria(entityType: string, ids: string[]): Promise<string | null> {
    if (entityType === 'lodging') {
      const lodgings = await this.lodgingRepo.findByIds(ids);
      const sorted = lodgings.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return sorted[0]?.id || null;
    }
    return null;
  }

  private async fetchSingleEntity(entityType: string, id: string): Promise<ChatCard[]> {
    switch (entityType) {
      case 'lodging': {
        const lodging = await this.lodgingRepo.findOne({
          where: { id },
          relations: ['town', 'images', 'images.imageResource', 'categories'],
        });
        return lodging ? [this.mapLodgingToCard(lodging)] : [];
      }
      case 'restaurant': {
        const restaurant = await this.restaurantRepo.findOne({
          where: { id },
          relations: ['town', 'images', 'images.imageResource', 'categories'],
        });
        return restaurant ? [this.mapRestaurantToCard(restaurant)] : [];
      }
      case 'experience': {
        const experience = await this.experienceRepo.findOne({
          where: { id },
          relations: ['town', 'images', 'images.imageResource', 'categories'],
        });
        return experience ? [this.mapExperienceToCard(experience)] : [];
      }
      case 'place': {
        const place = await this.placeRepo.findOne({
          where: { id },
          relations: ['town', 'images', 'images.imageResource', 'categories'],
        });
        return place ? [this.mapPlaceToCard(place)] : [];
      }
      case 'guide': {
        const guide = await this.guideRepo.findOne({
          where: { id },
          relations: ['town', 'images', 'images.imageResource', 'categories'],
        });
        return guide ? [this.mapGuideToCard(guide)] : [];
      }
      case 'transport': {
        const transport = await this.transportRepo.findOne({
          where: { id },
          relations: ['town', 'categories'],
        });
        return transport ? [this.mapTransportToCard(transport)] : [];
      }
      case 'commerce': {
        const commerce = await this.commerceRepo.findOne({
          where: { id },
          relations: ['town', 'images', 'images.imageResource', 'categories'],
        });
        return commerce ? [this.mapCommerceToCard(commerce)] : [];
      }
      default:
        this.logger.warn(`fetchSingleEntity: unknown entity type: ${entityType}`);
        return [];
    }
  }

  // =============================================
  // HELPERS
  // =============================================
  async resolveTownId(destination: string): Promise<string | null> {
    const town = await this.townRepo
      .createQueryBuilder('t')
      .where('LOWER(t.name) = LOWER(:name)', { name: destination })
      .getOne();

    return town?.id || null;
  }

  // Get simple results for state tracking
  getSimpleResults(cards: ChatCard[]): { id: string; name: string; position: number }[] {
    return cards.map((card, i) => ({
      id: card.id || '',
      name: card.title,
      position: i + 1,
    }));
  }
}
