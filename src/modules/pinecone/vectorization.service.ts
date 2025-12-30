import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pinecone, PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

import { appConfig } from 'src/config/app-config';
import { ChunkingService, ChunkResult, EntityType } from './chunking.service';

import { Lodging } from '../lodgings/entities';
import { Restaurant } from '../restaurants/entities';
import { Experience } from '../experiences/entities';
import { Place } from '../places/entities';
import { Guide } from '../guides/entities/guide.entity';
import { Transport } from '../transport/entities/transport.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Town } from '../towns/entities';

export interface VectorizationResult {
  entityType: EntityType;
  total: number;
  vectorized: number;
  errors: number;
}

@Injectable()
export class VectorizationService {
  private readonly logger = new Logger(VectorizationService.name);
  private readonly pineconeClient: Pinecone;
  private readonly embeddings: OpenAIEmbeddings;
  private readonly BATCH_SIZE = 100;

  constructor(
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,
    @InjectRepository(Transport)
    private readonly transportRepository: Repository<Transport>,
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
    private readonly chunkingService: ChunkingService,
  ) {
    this.pineconeClient = new Pinecone({
      apiKey: appConfig().pinecone.apiKey,
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: appConfig().openai.apiKey,
      modelName: 'text-embedding-3-small',
    });
  }

  /**
   * Get Pinecone index for vectorized data
   */
  private getIndex() {
    return this.pineconeClient.index(appConfig().pinecone.pineconeIndexVectorizedData);
  }

  /**
   * Vectorize all entities of all types
   */
  async vectorizeAll(): Promise<VectorizationResult[]> {
    const results: VectorizationResult[] = [];

    this.logger.log('🚀 Starting full vectorization...');

    results.push(await this.vectorizeLodgings());
    results.push(await this.vectorizeRestaurants());
    results.push(await this.vectorizeExperiences());
    results.push(await this.vectorizePlaces());
    results.push(await this.vectorizeGuides());
    results.push(await this.vectorizeTransports());
    results.push(await this.vectorizeCommerces());

    this.logger.log('✅ Full vectorization completed!');
    return results;
  }

  /**
   * Vectorize a single entity type
   */
  async vectorizeByType(entityType: EntityType): Promise<VectorizationResult> {
    switch (entityType) {
      case 'lodging':
        return this.vectorizeLodgings();
      case 'restaurant':
        return this.vectorizeRestaurants();
      case 'experience':
        return this.vectorizeExperiences();
      case 'place':
        return this.vectorizePlaces();
      case 'guide':
        return this.vectorizeGuides();
      case 'transport':
        return this.vectorizeTransports();
      case 'commerce':
        return this.vectorizeCommerces();
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Vectorize all lodgings
   */
  async vectorizeLodgings(): Promise<VectorizationResult> {
    this.logger.log('📦 Vectorizing lodgings...');

    const lodgings = await this.lodgingRepository.find({
      relations: {
        town: { department: true },
        categories: true,
        facilities: true,
      },
      where: { isPublic: true },
    });

    const chunks = lodgings.map(lodging => {
      const categoriesStr = lodging.categories?.map(c => c.name).join(', ') || '';
      const facilitiesStr = lodging.facilities?.map(f => f.name).join(', ') || '';
      const coords = lodging.location?.coordinates || [0, 0];

      return this.chunkingService.createLodgingChunk({
        id: lodging.id,
        name: lodging.name,
        slug: lodging.slug,
        description: lodging.description || undefined,
        town_name: lodging.town?.name || '',
        town_id: lodging.town?.id,
        department: lodging.town?.department?.name || '',
        lowest_price: lodging.lowestPrice || undefined,
        highest_price: lodging.highestPrice || undefined,
        rating: lodging.rating,
        latitude: coords[1],
        longitude: coords[0],
        urban_center_distance: lodging.urbanCenterDistance || undefined,
        phone: lodging.phoneNumbers?.[0] || undefined,
        whatsapp: lodging.whatsappNumbers?.[0] || undefined,
        email: lodging.email || undefined,
        address: lodging.address || undefined,
        categories: categoriesStr,
        facilities: facilitiesStr,
        created_at: lodging.createdAt?.toISOString(),
        updated_at: lodging.updatedAt?.toISOString(),
      });
    });

    return this.upsertChunks(chunks, 'lodging');
  }

  /**
   * Vectorize all restaurants
   */
  async vectorizeRestaurants(): Promise<VectorizationResult> {
    this.logger.log('🍽️ Vectorizing restaurants...');

    const restaurants = await this.restaurantRepository.find({
      relations: {
        town: { department: true },
        categories: true,
        facilities: true,
      },
      where: { isPublic: true },
    });

    const chunks = restaurants.map(restaurant => {
      const categoriesStr = restaurant.categories?.map(c => c.name).join(', ') || '';
      const facilitiesStr = restaurant.facilities?.map(f => f.name).join(', ') || '';
      const coords = restaurant.location?.coordinates || [0, 0];

      return this.chunkingService.createRestaurantChunk({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description || undefined,
        town_name: restaurant.town?.name || '',
        town_id: restaurant.town?.id,
        department: restaurant.town?.department?.name || '',
        rating: restaurant.rating,
        latitude: coords[1],
        longitude: coords[0],
        urban_center_distance: restaurant.urbanCenterDistance || undefined,
        phone: restaurant.phoneNumbers?.[0] || undefined,
        whatsapp: restaurant.whatsappNumbers?.[0] || undefined,
        email: restaurant.email || undefined,
        address: restaurant.address || undefined,
        categories: categoriesStr,
        facilities: facilitiesStr,
        created_at: restaurant.createdAt?.toISOString(),
        updated_at: restaurant.updatedAt?.toISOString(),
      });
    });

    return this.upsertChunks(chunks, 'restaurant');
  }

  /**
   * Vectorize all experiences
   */
  async vectorizeExperiences(): Promise<VectorizationResult> {
    this.logger.log('🎯 Vectorizing experiences...');

    const experiences = await this.experienceRepository.find({
      relations: {
        town: { department: true },
        categories: true,
        facilities: true,
      },
      where: { isPublic: true },
    });

    const chunks = experiences.map(experience => {
      const categoriesStr = experience.categories?.map(c => c.name).join(', ') || '';
      const facilitiesStr = experience.facilities?.map(f => f.name).join(', ') || '';
      const coords = experience.departureLocation?.coordinates || [0, 0];

      return this.chunkingService.createExperienceChunk({
        id: experience.id,
        title: experience.title,
        slug: experience.slug,
        description: experience.description || undefined,
        town_name: experience.town?.name || '',
        town_id: experience.town?.id,
        department: experience.town?.department?.name || '',
        price: experience.price,
        difficulty_level: Number(experience.difficultyLevel) || 3,
        duration: experience.travelTime || undefined,
        min_participants: experience.minParticipants || undefined,
        max_participants: experience.maxParticipants || undefined,
        start_latitude: coords[1],
        start_longitude: coords[0],
        categories: categoriesStr,
        facilities: facilitiesStr,
        created_at: experience.createdAt?.toISOString(),
        updated_at: experience.updatedAt?.toISOString(),
      });
    });

    return this.upsertChunks(chunks, 'experience');
  }

  /**
   * Vectorize all places
   */
  async vectorizePlaces(): Promise<VectorizationResult> {
    this.logger.log('🏔️ Vectorizing places...');

    const places = await this.placeRepository.find({
      relations: {
        town: { department: true },
        categories: true,
        facilities: true,
      },
      where: { isPublic: true },
    });

    const chunks = places.map(place => {
      const categoriesStr = place.categories?.map(c => c.name).join(', ') || '';
      const facilitiesStr = place.facilities?.map(f => f.name).join(', ') || '';
      const coords = place.location?.coordinates || [0, 0];

      return this.chunkingService.createPlaceChunk({
        id: place.id,
        name: place.name,
        slug: place.slug,
        description: place.description || undefined,
        town_name: place.town?.name || '',
        town_id: place.town?.id,
        department: place.town?.department?.name || '',
        history: place.history || undefined,
        altitude: place.altitude || undefined,
        temperature: place.temperature || undefined,
        difficulty_level: place.difficultyLevel || 3,
        recommendations: place.recommendations || undefined,
        rating: place.rating,
        latitude: coords[1],
        longitude: coords[0],
        urban_center_distance: place.urbarCenterDistance || undefined,
        categories: categoriesStr,
        facilities: facilitiesStr,
        created_at: place.createdAt?.toISOString(),
        updated_at: place.updatedAt?.toISOString(),
      });
    });

    return this.upsertChunks(chunks, 'place');
  }

  /**
   * Vectorize all guides
   */
  async vectorizeGuides(): Promise<VectorizationResult> {
    this.logger.log('🧭 Vectorizing guides...');

    const guides = await this.guideRepository.find({
      relations: {
        town: { department: true },
        categories: true,
      },
      where: { isPublic: true },
    });

    const chunks = guides.map(guide => {
      const categoriesStr = guide.categories?.map(c => c.name).join(', ') || '';

      return this.chunkingService.createGuideChunk({
        id: guide.id,
        full_name: `${guide.firstName} ${guide.lastName}`,
        slug: guide.slug,
        biography: guide.biography || undefined,
        town_name: guide.town?.name || undefined,
        town_id: guide.town?.id,
        department: guide.town?.department?.name || undefined,
        rating: guide.rating,
        email: guide.email,
        phone: guide.phone || undefined,
        whatsapp: guide.whatsapp || undefined,
        languages: guide.languages || [],
        categories: categoriesStr,
        created_at: guide.createdAt?.toISOString(),
        updated_at: guide.updatedAt?.toISOString(),
      });
    });

    return this.upsertChunks(chunks, 'guide');
  }

  /**
   * Vectorize all transports
   */
  async vectorizeTransports(): Promise<VectorizationResult> {
    this.logger.log('🚗 Vectorizing transports...');

    const transports = await this.transportRepository.find({
      relations: {
        town: { department: true },
        categories: true,
      },
      where: { isPublic: true },
    });

    const chunks = transports.map(transport => {
      const categoriesStr = transport.categories?.map(c => c.name).join(', ') || '';

      return this.chunkingService.createTransportChunk({
        id: transport.id,
        full_name: `${transport.firstName} ${transport.lastName}`,
        town_name: transport.town?.name || '',
        town_id: transport.town?.id,
        department: transport.town?.department?.name || '',
        rating: transport.rating,
        phone: transport.phone,
        whatsapp: transport.whatsapp || undefined,
        license_plate: transport.licensePlate,
        categories: categoriesStr,
        start_time: transport.startTime || undefined,
        end_time: transport.endTime || undefined,
        created_at: transport.createdAt?.toISOString(),
        updated_at: transport.updatedAt?.toISOString(),
      });
    });

    return this.upsertChunks(chunks, 'transport');
  }

  /**
   * Vectorize all commerces
   */
  async vectorizeCommerces(): Promise<VectorizationResult> {
    this.logger.log('🏪 Vectorizing commerces...');

    const commerces = await this.commerceRepository.find({
      relations: {
        town: { department: true },
        categories: true,
        facilities: true,
      },
      where: { isPublic: true },
    });

    const chunks = commerces.map(commerce => {
      const categoriesStr = commerce.categories?.map(c => c.name).join(', ') || '';
      const facilitiesStr = commerce.facilities?.map(f => f.name).join(', ') || '';
      const servicesStr = commerce.services?.join(', ') || '';
      const coords = commerce.location?.coordinates || [0, 0];

      return this.chunkingService.createCommerceChunk({
        id: commerce.id,
        name: commerce.name,
        slug: commerce.slug,
        description: commerce.description || undefined,
        town_name: commerce.town?.name || '',
        town_id: commerce.town?.id,
        department: commerce.town?.department?.name || '',
        rating: commerce.rating,
        latitude: coords[1],
        longitude: coords[0],
        urban_center_distance: commerce.urbanCenterDistance || undefined,
        phone: commerce.phoneNumbers?.[0] || undefined,
        whatsapp: commerce.whatsappNumbers?.[0] || undefined,
        email: commerce.email || undefined,
        address: commerce.address || undefined,
        categories: categoriesStr,
        facilities: facilitiesStr,
        services: servicesStr,
        created_at: commerce.createdAt?.toISOString(),
        updated_at: commerce.updatedAt?.toISOString(),
      });
    });

    return this.upsertChunks(chunks, 'commerce');
  }

  /**
   * Upsert chunks to Pinecone with embeddings, grouped by namespace (town_id)
   */
  private async upsertChunks(chunks: ChunkResult[], entityType: EntityType): Promise<VectorizationResult> {
    const index = this.getIndex();
    let vectorized = 0;
    let errors = 0;

    // Group chunks by town_id (namespace)
    const chunksByNamespace = new Map<string, ChunkResult[]>();
    for (const chunk of chunks) {
      const namespace = String(chunk.metadata.town_id || 'default');
      if (!chunksByNamespace.has(namespace)) {
        chunksByNamespace.set(namespace, []);
      }
      chunksByNamespace.get(namespace)!.push(chunk);
    }

    // Process each namespace
    for (const [namespace, namespaceChunks] of chunksByNamespace) {
      // Process in batches within each namespace
      for (let i = 0; i < namespaceChunks.length; i += this.BATCH_SIZE) {
        const batch = namespaceChunks.slice(i, i + this.BATCH_SIZE);

        try {
          // Generate embeddings for all chunks in batch
          const texts = batch.map(chunk => chunk.content);
          const embeddingArrays = await this.embeddings.embedDocuments(texts);

          // Create vectors
          const vectors: PineconeRecord<RecordMetadata>[] = batch.map((chunk, idx) => ({
            id: chunk.id,
            values: embeddingArrays[idx],
            metadata: chunk.metadata as RecordMetadata,
          }));

          // Upsert to Pinecone with namespace
          await index.namespace(namespace).upsert(vectors);

          vectorized += batch.length;
          this.logger.log(`  ✓ Namespace ${namespace}, Batch ${Math.floor(i / this.BATCH_SIZE) + 1}: ${batch.length} vectors upserted`);
        } catch (error) {
          errors += batch.length;
          this.logger.error(`  ✗ Namespace ${namespace}, Batch ${Math.floor(i / this.BATCH_SIZE) + 1} failed: ${error.message}`);
        }
      }
    }

    this.logger.log(`📊 ${entityType}: ${vectorized}/${chunks.length} vectorized, ${errors} errors`);

    return {
      entityType,
      total: chunks.length,
      vectorized,
      errors,
    };
  }

  /**
   * Delete all vectors for a specific entity type
   * Gets IDs directly from DB and deletes by ID (much faster than querying Pinecone)
   */
  async deleteByEntityType(entityType: EntityType): Promise<void> {
    this.logger.log(`🗑️ Deleting all ${entityType} vectors...`);

    const index = this.getIndex();

    // Get entities grouped by town from database
    let entitiesByTown: Map<string, string[]> = new Map();

    switch (entityType) {
      case 'lodging':
        const lodgings = await this.lodgingRepository.find({ relations: ['town'], select: ['id', 'town'] });
        lodgings.forEach(e => {
          const ns = e.town?.id || 'default';
          if (!entitiesByTown.has(ns)) entitiesByTown.set(ns, []);
          entitiesByTown.get(ns)!.push(`lodging_${e.id}`);
        });
        break;
      case 'restaurant':
        const restaurants = await this.restaurantRepository.find({ relations: ['town'], select: ['id', 'town'] });
        restaurants.forEach(e => {
          const ns = e.town?.id || 'default';
          if (!entitiesByTown.has(ns)) entitiesByTown.set(ns, []);
          entitiesByTown.get(ns)!.push(`restaurant_${e.id}`);
        });
        break;
      case 'experience':
        const experiences = await this.experienceRepository.find({ relations: ['town'], select: ['id', 'town'] });
        experiences.forEach(e => {
          const ns = e.town?.id || 'default';
          if (!entitiesByTown.has(ns)) entitiesByTown.set(ns, []);
          entitiesByTown.get(ns)!.push(`experience_${e.id}`);
        });
        break;
      case 'place':
        const places = await this.placeRepository.find({ relations: ['town'], select: ['id', 'town'] });
        places.forEach(e => {
          const ns = e.town?.id || 'default';
          if (!entitiesByTown.has(ns)) entitiesByTown.set(ns, []);
          entitiesByTown.get(ns)!.push(`place_${e.id}`);
        });
        break;
      case 'guide':
        const guides = await this.guideRepository.find({ relations: ['town'], select: ['id', 'town'] });
        guides.forEach(e => {
          const ns = e.town?.id || 'default';
          if (!entitiesByTown.has(ns)) entitiesByTown.set(ns, []);
          entitiesByTown.get(ns)!.push(`guide_${e.id}`);
        });
        break;
      case 'transport':
        const transports = await this.transportRepository.find({ relations: ['town'], select: ['id', 'town'] });
        transports.forEach(e => {
          const ns = e.town?.id || 'default';
          if (!entitiesByTown.has(ns)) entitiesByTown.set(ns, []);
          entitiesByTown.get(ns)!.push(`transport_${e.id}`);
        });
        break;
      case 'commerce':
        const commerces = await this.commerceRepository.find({ relations: ['town'], select: ['id', 'town'] });
        commerces.forEach(e => {
          const ns = e.town?.id || 'default';
          if (!entitiesByTown.has(ns)) entitiesByTown.set(ns, []);
          entitiesByTown.get(ns)!.push(`commerce_${e.id}`);
        });
        break;
    }

    let totalDeleted = 0;

    // Delete from each namespace
    for (const [namespace, ids] of entitiesByTown) {
      try {
        await index.namespace(namespace).deleteMany(ids);
        totalDeleted += ids.length;
        this.logger.log(`  ✓ Namespace ${namespace}: deleted ${ids.length} vectors`);
      } catch (error) {
        this.logger.warn(`  ⚠️ Namespace ${namespace}: ${error.message}`);
      }
    }

    if (totalDeleted > 0) {
      this.logger.log(`✅ Deleted ${totalDeleted} ${entityType} vectors total`);
    } else {
      this.logger.log(`⚠️ No ${entityType} vectors found to delete`);
    }
  }

  /**
   * Delete a single entity vector
   */
  async deleteEntity(entityType: EntityType, entityId: string): Promise<void> {
    const index = this.getIndex();
    const vectorId = `${entityType}_${entityId}`;

    await index.deleteOne(vectorId);
    this.logger.log(`🗑️ Deleted vector: ${vectorId}`);
  }

  /**
   * Search for similar entities
   * If townId is provided, searches only in that namespace
   * Otherwise searches across all namespaces
   */
  async search(
    query: string,
    options: {
      topK?: number;
      entityType?: EntityType;
      townId?: string;
      department?: string;
    } = {},
  ) {
    const index = this.getIndex();
    const { topK = 10, entityType, townId, department } = options;

    // Generate embedding for query
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Build filter
    const filter: Record<string, unknown> = {};
    if (entityType) {
      filter.entity_type = { $eq: entityType };
    }
    if (department) {
      filter.department = { $eq: department };
    }

    // If townId is provided, search only in that namespace
    if (townId) {
      const results = await index.namespace(townId).query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      });

      return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      }));
    }

    // Otherwise, search across all namespaces
    const towns = await this.townRepository.find({ select: ['id'] });
    const namespaces = [...towns.map(t => t.id), 'default'];

    const allResults: { id: string; score: number; metadata: unknown }[] = [];

    for (const namespace of namespaces) {
      try {
        const results = await index.namespace(namespace).query({
          vector: queryEmbedding,
          topK,
          includeMetadata: true,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        });

        allResults.push(
          ...results.matches.map(match => ({
            id: match.id,
            score: match.score || 0,
            metadata: match.metadata,
          })),
        );
      } catch (error) {
        // Namespace might not exist, skip it
      }
    }

    // Sort by score and return top K
    return allResults.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
