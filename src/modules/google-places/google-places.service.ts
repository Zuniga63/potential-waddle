import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { EnvironmentVariables } from 'src/config/app-config';
@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly apiKey: string | undefined;
  constructor(
    private readonly httpService: HttpService,

    @InjectRepository(Lodging)
    private lodgingRepository: Repository<Lodging>,
    configService: ConfigService<EnvironmentVariables>,
  ) {
    this.apiKey = configService.get<string>('googlePlaces.apiKey', { infer: true });
  }

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

  async updateGooglePlaceId(placeId: string): Promise<void> {
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

  async updatePlaceDetails(placeId: string): Promise<void> {
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

  async updateAllLodgings(): Promise<void> {
    try {
      const lodgings = await this.lodgingRepository.find();

      for (const lodging of lodgings) {
        // Si no tiene Google Place ID, intentamos obtenerlo primero
        if (!lodging.googleMapsId) {
          await this.updateGooglePlaceId(lodging.id);
          // Esperar un poco para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Si ya tiene o acabamos de obtener el Google Place ID, actualizamos los detalles
        if (lodging.googleMapsId) {
          console.log(`Actualizando detalles para ${lodging.name}`);
          await this.updatePlaceDetails(lodging.id);
          // Esperar entre solicitudes para no exceder los límites de la API
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      this.logger.error(`Error al actualizar todos los lugares: ${error.message}`);
    }
  }
}
