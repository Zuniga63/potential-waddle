import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { EnvironmentVariables } from 'src/config/app-config';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import axios from 'axios';
import { GoogleReview } from './entities/google-review.entity';
import { GoogleReviewsFindAllParams } from './interfaces/google-reviews-find-all-params.interface';
import { generateReviewsQueryFilters } from './utils/generate-google-reviews-query-filters';
import { GoogleReviewsListDto } from './dto/google-reviews-list.dto';
import { GoogleReviewInterface } from './interfaces/google-review.interface';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GoogleReviewSummary } from './entities/google-review-summary.entity';
import { reviewAnalysisPrompt } from '../ai/lib/gemini/review-analysis-prompts';
@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly apiKey: string | undefined;
  private readonly serpApiKey: string | undefined;
  private readonly apifyToken: string | undefined;
  private readonly actorId = 'apify/google-maps-reviews-scraper';
  private readonly geminiModel: GenerativeModel;
  constructor(
    private readonly httpService: HttpService,

    @InjectRepository(Lodging)
    private lodgingRepository: Repository<Lodging>,
    configService: ConfigService<EnvironmentVariables>,

    @InjectRepository(Commerce)
    private commerceRepository: Repository<Commerce>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,

    @InjectRepository(GoogleReview)
    private googleReviewRepository: Repository<GoogleReview>,

    @InjectRepository(GoogleReviewSummary)
    private googleReviewSummaryRepository: Repository<GoogleReviewSummary>,
  ) {
    this.apiKey = configService.get<string>('googlePlaces.apiKey', { infer: true });
    this.serpApiKey = configService.get<string>('serpApi.apiKey', { infer: true });
    this.apifyToken = configService.get<string>('apify.apiKey', { infer: true });

    // Initialize Gemini AI
    const geminiApiKey = configService.get<string>('gemini.apiKey', { infer: true });
    const geminiModelName = configService.get<string>('gemini.model', { infer: true }) ?? 'gemini-2.5-flash-lite';
    if (geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      this.geminiModel = genAI.getGenerativeModel({
        model: geminiModelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
        },
      });
    }
  }

  // 🔹 Extract Place ID from Google Maps URL
  async findPlaceIdFromUrl(googleMapsUrl: string): Promise<string | null> {
    try {
      // Usar la API de Places para buscar con la URL directamente
      const url = `https://places.googleapis.com/v1/places:searchText`;

      const response = await lastValueFrom(
        this.httpService.post(
          url,
          { textQuery: googleMapsUrl },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': this.apiKey,
              'X-Goog-FieldMask': 'places.id',
            },
          },
        ),
      );

      if (response.data.places && response.data.places.length > 0) {
        this.logger.log(`Place ID encontrado desde URL: ${response.data.places[0].id}`);
        return response.data.places[0].id;
      }

      this.logger.warn(`No se encontró Place ID para la URL: ${googleMapsUrl}`);
      return null;
    } catch (error) {
      this.logger.error(`Error al extraer Place ID de URL: ${error.message}`);
      return null;
    }
  }

  // 🔹 Find Place ID by Name
  async findPlaceIdByName(name: string, address?: string): Promise<string | null> {
    try {
      const input = address ? `${name}, San Rafael, Antioquia, Colombia` : name;
      const url = `https://places.googleapis.com/v1/places:searchText`; // 🔹 Nuevo endpoint de Places API (New)

      const response = await lastValueFrom(
        this.httpService.post(
          url,
          { textQuery: input }, // 🔹 Se envía en el body
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': this.apiKey, // 🔹 API Key en Header
              'X-Goog-FieldMask': 'places.id', // 🔹 Se especifica qué campos devolver
            },
          },
        ),
      );

      if (response.data.places && response.data.places.length > 0) {
        return response.data.places[0].id; // 🔹 Nuevo formato en API (New)
      }

      this.logger.warn(`No se encontró Google Place ID para: ${name}`);
      return null;
    } catch (error) {
      this.logger.error(`Error al buscar Google Place ID: ${error.message}`);
      return null;
    }
  }

  async getPlaceDetails(placeId: string): Promise<any | null> {
    try {
      const url = `https://places.googleapis.com/v1/places/${placeId}`; // 🔹 Nuevo endpoint de Places API (New)

      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey, // 🔹 API Key en Header
            'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri', // 🔹 Campos específicos en FieldMask
          },
        }),
      );

      if (response.data) {
        return response.data; // 🔹 La respuesta ya contiene los datos sin "result"
      }

      return null;
    } catch (error) {
      this.logger.error(`Error al obtener detalles del lugar: ${error.message}`);
      return null;
    }
  }

  // 🔹 Update Google Place ID for Lodging
  async updateGooglePlaceIdLodging(placeId: string): Promise<void> {
    try {
      const lodging = await this.lodgingRepository.findOne({
        where: { id: placeId },
      });
      if (!lodging) {
        this.logger.warn(`Lugar con ID ${placeId} no encontrado`);
        return;
      }

      if (!lodging.googleMapsId) {
        let googlePlaceId: string | null = null;

        // 1. Primero intentar extraer de la URL de Google Maps si existe
        if (lodging.googleMapsUrl) {
          this.logger.log(`Intentando extraer Place ID desde URL para: ${lodging.name}`);
          googlePlaceId = await this.findPlaceIdFromUrl(lodging.googleMapsUrl);
        }

        // 2. Si no se pudo extraer de la URL, buscar por nombre
        if (!googlePlaceId) {
          this.logger.log(`Buscando Place ID por nombre para: ${lodging.name}`);
          googlePlaceId = await this.findPlaceIdByName(lodging.name, lodging.address || undefined);
        }

        if (googlePlaceId) {
          lodging.googleMapsId = googlePlaceId;
          await this.lodgingRepository.save(lodging);
          this.logger.log(`Place ID guardado para ${lodging.name}: ${googlePlaceId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar Google Place ID: ${error.message}`);
    }
  }

  // 🔹 Update Google Place ID for Restaurant
  async updateGooglePlaceIdRestaurant(placeId: string): Promise<void> {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: placeId },
      });
      if (!restaurant) {
        this.logger.warn(`Lugar con ID ${placeId} no encontrado`);
        return;
      }

      if (!restaurant.googleMapsId) {
        let googlePlaceId: string | null = null;

        // 1. Primero intentar extraer de la URL de Google Maps si existe
        if (restaurant.googleMapsUrl) {
          this.logger.log(`Intentando extraer Place ID desde URL para: ${restaurant.name}`);
          googlePlaceId = await this.findPlaceIdFromUrl(restaurant.googleMapsUrl);
        }

        // 2. Si no se pudo extraer de la URL, buscar por nombre
        if (!googlePlaceId) {
          this.logger.log(`Buscando Place ID por nombre para: ${restaurant.name}`);
          googlePlaceId = await this.findPlaceIdByName(restaurant.name, restaurant.address || undefined);
        }

        if (googlePlaceId) {
          restaurant.googleMapsId = googlePlaceId;
          await this.restaurantRepository.save(restaurant);
          this.logger.log(`Place ID guardado para ${restaurant.name}: ${googlePlaceId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar Google Place ID: ${error.message}`);
    }
  }

  // 🔹 Update Google Place ID for Commerce
  async updateGooglePlaceIdCommerce(placeId: string): Promise<void> {
    try {
      const commerce = await this.commerceRepository.findOne({
        where: { id: placeId },
      });
      if (!commerce) {
        this.logger.warn(`Lugar con ID ${placeId} no encontrado`);
        return;
      }

      if (!commerce.googleMapsId) {
        let googlePlaceId: string | null = null;

        // 1. Primero intentar extraer de la URL de Google Maps si existe
        if (commerce.googleMapsUrl) {
          this.logger.log(`Intentando extraer Place ID desde URL para: ${commerce.name}`);
          googlePlaceId = await this.findPlaceIdFromUrl(commerce.googleMapsUrl);
        }

        // 2. Si no se pudo extraer de la URL, buscar por nombre
        if (!googlePlaceId) {
          this.logger.log(`Buscando Place ID por nombre para: ${commerce.name}`);
          googlePlaceId = await this.findPlaceIdByName(commerce.name, commerce.address || undefined);
        }

        if (googlePlaceId) {
          commerce.googleMapsId = googlePlaceId;
          await this.commerceRepository.save(commerce);
          this.logger.log(`Place ID guardado para ${commerce.name}: ${googlePlaceId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar Google Place ID: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Remove Google Place ID
  // ------------------------------------------------------------------------------------------------
  async removeGooglePlaceId(placeId: string, model: string): Promise<void> {
    if (model === 'commerce') {
      await this.commerceRepository.update(placeId, { googleMapsId: null });
    } else if (model === 'restaurant') {
      await this.restaurantRepository.update(placeId, { googleMapsId: null });
    } else if (model === 'lodging') {
      await this.lodgingRepository.update(placeId, { googleMapsId: null });
    }
  }

  async getDrivingDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<{ distanceText: string; distanceValue: number }> {
    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${this.apiKey}`;

    const response = await this.httpService.axiosRef.get(url);
    const route = response.data.routes[0];

    if (!route) {
      throw new Error('No se encontró una ruta.');
    }

    const leg = route.legs[0];

    return {
      distanceText: leg.distance.text, // Ej: "7.8 km"
      distanceValue: leg.distance.value / 1000, // valor en km (Google lo da en metros)
    };
  }

  // ------------------------------------------------------------------------------------------------
  // Get All Reviews
  // ------------------------------------------------------------------------------------------------
  async fetchReviewsFromApify(entityId: string, entityType: string): Promise<any[]> {
    let placeUrl: string;
    if (entityType === 'lodging') {
      const lodging = await this.lodgingRepository.findOne({ where: { id: entityId } });
      placeUrl = lodging?.googleMapsUrl || '';
      if (!placeUrl) {
        throw new HttpException(
          'Tu alojamiento no tiene una URL de Google Maps configurada. Por favor, contacta al administrador del sistema.',
          404,
        );
      }
    } else if (entityType === 'restaurant') {
      const restaurant = await this.restaurantRepository.findOne({ where: { id: entityId } });
      placeUrl = restaurant?.googleMapsUrl || '';
      if (!placeUrl) {
        throw new HttpException(
          'Tu restaurante no tiene una URL de Google Maps configurada. Por favor, contacta al administrador del sistema.',
          404,
        );
      }
    } else if (entityType === 'commerce') {
      const commerce = await this.commerceRepository.findOne({ where: { id: entityId } });
      placeUrl = commerce?.googleMapsUrl || '';
      if (!placeUrl) {
        throw new HttpException(
          'Tu comercio no tiene una URL de Google Maps configurada. Por favor, contacta al administrador del sistema.',
          404,
        );
      }
    } else {
      throw new HttpException(`Tipo de entidad '${entityType}' no soportado para obtener reseñas.`, 400);
    }

    if (!placeUrl) {
      return [];
    }

    const runUrl = `https://api.apify.com/v2/acts/compass~Google-Maps-Reviews-Scraper/runs?token=${this.apifyToken}`;
    const payload = {
      startUrls: [{ url: placeUrl }],
      reviewsCount: 1000,
      language: 'es',
      includeReviewId: true,
    };

    // Paso 1: Lanzar el actor
    let runId: string;
    try {
      const { data } = await axios.post(runUrl, payload, { timeout: 10000 });
      runId = data.data.id;
      console.log(`🚀 Actor lanzado. RunID: ${runId}`);
    } catch (err) {
      console.error('❌ Error al lanzar actor:', err.response?.data || err.message);
      throw new HttpException('Error lanzando actor en Apify', 500);
    }

    // Paso 2: Polling del estado del actor
    let statusRes;
    for (let i = 0; i < 20; i++) {
      try {
        statusRes = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${this.apifyToken}`);
        const runStatus = statusRes.data.data.status;
        console.log(`⏳ Estado del actor: ${runStatus}`);
        if (runStatus === 'SUCCEEDED') break;
      } catch (err) {
        console.warn('❗ Error durante polling del estado:', err.message);
      }
      await new Promise(res => setTimeout(res, 5000)); // Espera 5s
    }

    if (statusRes?.data?.data?.status !== 'SUCCEEDED') {
      throw new HttpException('Tiempo de espera agotado para Apify', 504);
    }
    // Paso 3: Obtener los resultados del dataset
    const datasetId = statusRes.data.data.defaultDatasetId || statusRes.data.data.outputDatasetId;

    if (!datasetId) {
      throw new HttpException('No se pudo obtener el dataset ID del actor Apify', 500);
    }
    console.log(`📦 Dataset ID encontrado: ${datasetId}`);

    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${this.apifyToken}&clean=true`;

    try {
      const response = await axios.get(datasetUrl);
      const reviews = response.data;
      console.log(`✅ Reseñas obtenidas: ${reviews.length}`);
      const reviewsToSave: GoogleReviewInterface[] = [];
      for (const review of reviews) {
        // Check if review already exists
        const existingReview = await this.googleReviewRepository.findOne({
          where: { reviewId: review.reviewId },
        });

        if (!existingReview) {
          const googleReview = {
            entityId,
            entityType,
            authorName: review.name,
            rating: review.stars,
            text: review.text,
            reviewUrl: review.reviewUrl,
            reviewId: review.reviewId,
            reviewDate: review.publishedAtDate,
          };
          const savedReview = await this.googleReviewRepository.save(googleReview as DeepPartial<GoogleReview>);
          reviewsToSave.push(savedReview as unknown as GoogleReviewInterface);
          console.log(`✅ Nueva reseña guardada: ${googleReview.authorName}`);
        } else {
          console.log(`ℹ️ Reseña ya existe: ${review.reviewId}`);
        }
      }

      return reviews;
    } catch (err) {
      console.error('❌ Error al obtener datos del dataset:', err.message);
      throw new HttpException('Error al obtener reseñas desde Apify dataset', 500);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get All Reviews
  // ------------------------------------------------------------------------------------------------
  async getAllReviews({
    filters,
    entityId,
    entityType,
  }: GoogleReviewsFindAllParams = {}): Promise<GoogleReviewsListDto> {
    const { page = 1, limit = 25 } = filters ?? {};
    const skip = (page - 1) * limit;
    const { where, order } = generateReviewsQueryFilters(filters, entityId, entityType);
    console.log(order, 'order');
    const [reviews, count] = await this.googleReviewRepository.findAndCount({
      skip,
      take: limit,
      order,
      where,
    });

    return new GoogleReviewsListDto({ currentPage: page, pages: Math.ceil(count / limit), count }, reviews);
  }

  async deleteAllReviewsforEntity(entityId: string, entityType: string) {
    console.log('🔍 Eliminando todas las reseñas para la entidad:', entityId, entityType);
    if (entityType === 'lodging') {
      await this.googleReviewRepository.delete({ entityId, entityType: 'lodging' });
      await this.googleReviewSummaryRepository.delete({ entityId, entityType: 'lodging' });
    } else if (entityType === 'restaurant') {
      await this.googleReviewRepository.delete({ entityId, entityType: 'restaurant' });
      await this.googleReviewSummaryRepository.delete({ entityId, entityType: 'restaurant' });
    } else if (entityType === 'commerce') {
      await this.googleReviewRepository.delete({ entityId, entityType: 'commerce' });
      await this.googleReviewSummaryRepository.delete({ entityId, entityType: 'commerce' });
    }
  }

  async reviewSummary(
    message: string,
    entityId: string,
    entityType: 'lodging' | 'restaurant' | 'commerce',
  ) {
    try {
      if (!this.geminiModel) {
        throw new Error('Gemini AI is not configured. Please set GEMINI_API_KEY.');
      }

      const userQuestion = message;

      // Get all reviews for general analysis
      const reviews = await this.googleReviewRepository.find({
        where: { entityType, entityId },
        order: { reviewDate: 'DESC' },
      });

      const reviewsData = reviews.map(review => ({
        autor: review.authorName,
        rating: review.rating,
        comentario: review.text,
        fecha: review.reviewDate,
      }));

      this.logger.log(`Analyzing ${reviews.length} reviews for ${entityType} ${entityId}`);
      const contextMessage = JSON.stringify(reviewsData, null, 2);
      const prompt = `${reviewAnalysisPrompt}\n\n## RESEÑAS A ANALIZAR (${reviews.length} total):\n${contextMessage}`;

      // Send to Gemini
      this.logger.log(`🤖 Sending request to GEMINI 2.0 Flash...`);
      const result = await this.geminiModel.generateContent(prompt);
      const responseText = result.response.text();
      this.logger.log(`✅ GEMINI response received (${responseText.length} chars)`);

      // Save the summary
      const summary = this.googleReviewSummaryRepository.create({
        entityId,
        entityType,
        question: userQuestion,
        content: responseText,
        createdAt: new Date(),
      });
      await this.googleReviewSummaryRepository.save(summary);

      this.logger.log(`Summary generated successfully for ${entityType} ${entityId}`);

      return {
        response: responseText,
      };
    } catch (error) {
      this.logger.error('Error generating review summary:', error);
      throw error;
    }
  }

  async getReviewsSummary(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    const reviews = await this.googleReviewSummaryRepository.find({
      where: { entityId, entityType },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    return reviews;
  }

  async getReviewsCountByRating(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    const reviews = await this.googleReviewRepository.find({
      where: { entityId, entityType },
    });
    // Contar cuántos reviews hay por cada rating
    const numberToText: Record<number, string> = {
      0: 'Cero',
      1: 'uno',
      2: 'dos',
      3: 'tres',
      4: 'cuatro',
      5: 'cinco',
    };
    const counts: Record<string, number> = {};
    for (const review of reviews) {
      // Exclude unrated reviews (NULL or 0 star) so the distribution matches the
      // summary count and the list — Apify sometimes returns a review with no star.
      if (review.rating == null || review.rating < 1) continue;
      const key = numberToText[review.rating] || review.rating.toString();
      counts[key] = (counts[key] || 0) + 1;
    }
    // Transforma el objeto counts a un array ordenado
    const result = [5, 4, 3, 2, 1, 0].map(num => ({
      name: numberToText[num],
      value: counts[numberToText[num]] || 0,
    }));
    return result;
  }

  async getReviewsCountByYear(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    const reviews = await this.googleReviewRepository.find({
      where: { entityId, entityType },
    });

    // Agrupar por año
    const counts: Record<string, number> = {};
    for (const review of reviews) {
      if (!review.reviewDate || review.rating == null || review.rating < 1) continue;
      const year = new Date(review.reviewDate).getFullYear().toString();
      counts[year] = (counts[year] || 0) + 1;
    }

    // Convertir a array de objetos [{name: "2023", value: 10}, ...]
    const result = Object.entries(counts)
      .map(([year, value]) => ({ name: year, value }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Opcional: ordenar por año

    return result;
  }

  /**
   * Get reviews count by month for the current year
   * Returns: [{ name: "Ene", value: 10 }, ...]
   */
  async getReviewsCountByMonth(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    const currentYear = new Date().getFullYear();
    const reviews = await this.googleReviewRepository.find({
      where: { entityId, entityType },
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const counts: number[] = new Array(12).fill(0);

    for (const review of reviews) {
      if (!review.reviewDate || review.rating == null || review.rating < 1) continue;
      const date = new Date(review.reviewDate);
      if (date.getFullYear() === currentYear) {
        counts[date.getMonth()]++;
      }
    }

    return monthNames.map((name, index) => ({
      name,
      value: counts[index],
    }));
  }

  /**
   * Get rating trend over time (average rating per month)
   * Returns: [{ month: "Ene 2024", rating: 4.5, count: 15 }, ...]
   */
  async getReviewsRatingTrend(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    const reviews = await this.googleReviewRepository.find({
      where: { entityId, entityType },
      order: { reviewDate: 'ASC' },
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyData: Record<string, { sum: number; count: number }> = {};

    for (const review of reviews) {
      if (!review.reviewDate || review.rating == null || review.rating < 1) continue;
      const date = new Date(review.reviewDate);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { sum: 0, count: 0 };
      }
      monthlyData[key].sum += review.rating;
      monthlyData[key].count++;
    }

    // Convert to array and sort by date
    const result = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        rating: Number((data.sum / data.count).toFixed(2)),
        count: data.count,
      }))
      .slice(-12); // Last 12 months

    return result;
  }

  /**
   * Get aggregate metrics for reviews
   * Returns: { averageRating, totalReviews, fiveStarPercentage, monthlyChange, distribution }
   */
  async getReviewsMetrics(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    this.logger.log(`📊 getReviewsMetrics called: entityId=${entityId}, entityType=${entityType}`);
    const reviews = await this.googleReviewRepository.find({
      where: { entityId, entityType },
    });
    this.logger.log(`📊 Found ${reviews.length} reviews for metrics`);

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        fiveStarCount: 0,
        fiveStarPercentage: 0,
        thisMonthCount: 0,
        lastMonthCount: 0,
        monthlyChange: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    // Calculate average rating over RATED reviews only (exclude NULL/0 stars —
    // Apify sometimes returns a review without a star; counting it would skew
    // the totals below the way it inflates the count vs Google).
    const validRatings = reviews.filter(r => r.rating != null && r.rating >= 1);
    const totalRating = validRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = validRatings.length
      ? Number((totalRating / validRatings.length).toFixed(2))
      : 0;

    // Calculate distribution
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const review of reviews) {
      if (review.rating != null && distribution[review.rating] !== undefined) {
        distribution[review.rating]++;
      }
    }

    // Five star percentage — over rated reviews only (same denominator as the count)
    const fiveStarCount = distribution[5];
    const fiveStarPercentage = validRatings.length
      ? Number(((fiveStarCount / validRatings.length) * 100).toFixed(1))
      : 0;

    // Monthly change calculation
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    for (const review of reviews) {
      if (!review.reviewDate || review.rating == null || review.rating < 1) continue;
      const date = new Date(review.reviewDate);
      if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
        thisMonthCount++;
      }
      if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
        lastMonthCount++;
      }
    }

    const monthlyChange =
      lastMonthCount > 0
        ? Number((((thisMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(1))
        : thisMonthCount > 0
          ? 100
          : 0;

    return {
      averageRating,
      totalReviews: validRatings.length,
      fiveStarCount,
      fiveStarPercentage,
      thisMonthCount,
      lastMonthCount,
      monthlyChange,
      distribution,
    };
  }

  /**
   * Combined analytics: star distribution + monthly rating trend.
   * Returns: { distribution: [{name, value}], trend: [{month, rating, count}] }
   * Delegates to existing aggregation methods — no new SQL.
   */
  async getAnalytics(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    const [distribution, trend] = await Promise.all([
      this.getReviewsCountByRating(entityId, entityType),
      this.getReviewsRatingTrend(entityId, entityType),
    ]);
    return { distribution, trend };
  }
}
