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
import { PineconeService } from '../pinecone/pinecone.service';
import { GoogleReviewInterface } from './interfaces/google-review.interface';
@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly apiKey: string | undefined;
  private readonly serpApiKey: string | undefined;
  private readonly apifyToken: string | undefined;
  private readonly actorId = 'apify/google-maps-reviews-scraper';
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
    private readonly pineconeService: PineconeService,
  ) {
    this.apiKey = configService.get<string>('googlePlaces.apiKey', { infer: true });
    this.serpApiKey = configService.get<string>('serpApi.apiKey', { infer: true });
    this.apifyToken = configService.get<string>('apify.apiKey', { infer: true });
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
        const googlePlaceId = await this.findPlaceIdByName(lodging.name, lodging.address || undefined);
        if (googlePlaceId) {
          lodging.googleMapsId = googlePlaceId;
          await this.lodgingRepository.save(lodging);
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar Google Place ID: ${error.message}`);
    }
  }

  // 🔹 Update Lodging Details
  async updateLodgingDetails(placeId: string): Promise<void> {
    try {
      const lodging = await this.lodgingRepository.findOne({ where: { id: placeId } });
      if (!lodging || !lodging.googleMapsId) {
        this.logger.warn(`Lugar con ID ${placeId} no tiene Google Place ID`);
        return;
      }

      const details = await this.getPlaceDetails(lodging.googleMapsId);
      if (!details) {
        this.logger.warn(`No se encontraron detalles para el lugar ID ${placeId}`);
        return;
      }

      lodging.googleMapsRating = details.rating || lodging.googleMapsRating;
      lodging.googleMapsReviewsCount = details.userRatingCount || lodging.googleMapsReviewsCount;
      lodging.googleMapsUrl = details.googleMapsUri || lodging.googleMapsUrl;
      lodging.googleMapsName = details.displayName.text || lodging.googleMapsName;

      await this.lodgingRepository.save(lodging);
      this.logger.log(`Detalles actualizados para ${lodging.name}`);
    } catch (error) {
      this.logger.error(`Error al actualizar detalles: ${error.message}`);
    }
  }

  // 🔹 Update All Lodgings
  async updateAllLodgings(): Promise<void> {
    try {
      const lodgings = await this.lodgingRepository.find();

      for (const lodging of lodgings) {
        // Si no tiene Google Place ID, intentamos obtenerlo primero
        if (!lodging.googleMapsId) {
          await this.updateGooglePlaceIdLodging(lodging.id);
          // Esperar un poco para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Si ya tiene o acabamos de obtener el Google Place ID, actualizamos los detalles
        if (lodging.googleMapsId) {
          console.log(`Actualizando detalles para ${lodging.name}`);
          await this.updateLodgingDetails(lodging.id);
          // Esperar entre solicitudes para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar todos los lugares: ${error.message}`);
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
        const googlePlaceId = await this.findPlaceIdByName(restaurant.name, restaurant.address || undefined);
        if (googlePlaceId) {
          restaurant.googleMapsId = googlePlaceId;
          await this.restaurantRepository.save(restaurant);
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar Google Place ID: ${error.message}`);
    }
  }

  // 🔹 Update Restaurant Details
  async updateRestaurantDetails(placeId: string): Promise<void> {
    try {
      const restaurant = await this.restaurantRepository.findOne({ where: { id: placeId } });
      if (!restaurant || !restaurant.googleMapsId) {
        this.logger.warn(`Lugar con ID ${placeId} no tiene Google Place ID`);
        return;
      }

      const details = await this.getPlaceDetails(restaurant.googleMapsId);
      if (!details) {
        this.logger.warn(`No se encontraron detalles para el lugar ID ${placeId}`);
        return;
      }

      restaurant.googleMapsRating = details.rating || restaurant.googleMapsRating;
      restaurant.googleMapsReviewsCount = details.userRatingCount || restaurant.googleMapsReviewsCount;
      restaurant.googleMapsUrl = details.googleMapsUri || restaurant.googleMapsUrl;
      restaurant.googleMapsName = details.displayName.text || restaurant.googleMapsName;

      await this.restaurantRepository.save(restaurant);
      this.logger.log(`Detalles actualizados para ${restaurant.name}`);
    } catch (error) {
      this.logger.error(`Error al actualizar detalles: ${error.message}`);
    }
  }

  // 🔹 Update All Restaurants
  async updateAllRestaurants(): Promise<void> {
    try {
      const restaurants = await this.restaurantRepository.find();

      for (const restaurant of restaurants) {
        // Si no tiene Google Place ID, intentamos obtenerlo primero
        if (!restaurant.googleMapsId) {
          await this.updateGooglePlaceIdRestaurant(restaurant.id);
          // Esperar un poco para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Si ya tiene o acabamos de obtener el Google Place ID, actualizamos los detalles
        if (restaurant.googleMapsId) {
          console.log(`Actualizando detalles para ${restaurant.name}`);
          await this.updateRestaurantDetails(restaurant.id);
          // Esperar entre solicitudes para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar todos los lugares: ${error.message}`);
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
        const googlePlaceId = await this.findPlaceIdByName(commerce.name, commerce.address || undefined);
        if (googlePlaceId) {
          commerce.googleMapsId = googlePlaceId;
          await this.commerceRepository.save(commerce);
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar Google Place ID: ${error.message}`);
    }
  }

  // 🔹 Update Commerce Details
  async updateCommerceDetails(placeId: string): Promise<void> {
    try {
      const commerce = await this.commerceRepository.findOne({ where: { id: placeId } });
      if (!commerce || !commerce.googleMapsId) {
        this.logger.warn(`Lugar con ID ${placeId} no tiene Google Place ID`);
        return;
      }

      const details = await this.getPlaceDetails(commerce.googleMapsId);
      if (!details) {
        this.logger.warn(`No se encontraron detalles para el lugar ID ${placeId}`);
        return;
      }

      commerce.googleMapsRating = details.rating || commerce.googleMapsRating;
      commerce.googleMapsReviewsCount = details.userRatingCount || commerce.googleMapsReviewsCount;
      commerce.googleMapsUrl = details.googleMapsUri || commerce.googleMapsUrl;
      commerce.googleMapsName = details.displayName.text || commerce.googleMapsName;

      await this.commerceRepository.save(commerce);
      this.logger.log(`Detalles actualizados para ${commerce.name}`);
    } catch (error) {
      this.logger.error(`Error al actualizar detalles: ${error.message}`);
    }
  }

  // 🔹 Update All Commerces
  async updateAllCommerces(): Promise<void> {
    try {
      const commerces = await this.commerceRepository.find();

      for (const commerce of commerces) {
        // Si no tiene Google Place ID, intentamos obtenerlo primero
        if (!commerce.googleMapsId) {
          await this.updateGooglePlaceIdCommerce(commerce.id);
          // Esperar un poco para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Si ya tiene o acabamos de obtener el Google Place ID, actualizamos los detalles
        if (commerce.googleMapsId) {
          console.log(`Actualizando detalles para ${commerce.name}`);
          await this.updateCommerceDetails(commerce.id);
          // Esperar entre solicitudes para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar todos los lugares: ${error.message}`);
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

      try {
        console.log('🔍 Creando vector en Pinecone');
        await this.pineconeService.createReviewVector(reviewsToSave as GoogleReviewInterface[]);
      } catch (err) {
        console.error('❌ Error al crear vector en Pinecone:', err.message);
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
      console.log('🔍 Eliminando reseñas de alojamiento');
      await this.googleReviewRepository.delete({ entityId, entityType: 'lodging' });
      console.log('🔍 Eliminando vectores de alojamiento');
      await this.pineconeService.deleteAllVectorsByEntityId(entityId, entityType);
    } else if (entityType === 'restaurant') {
      console.log('🔍 Eliminando reseñas de restaurante');
      await this.googleReviewRepository.delete({ entityId, entityType: 'restaurant' });
      console.log('🔍 Eliminando vectores de restaurante');
      await this.pineconeService.deleteAllVectorsByEntityId(entityId, entityType);
    }
  }
}
