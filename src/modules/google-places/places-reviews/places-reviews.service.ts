// src/reviews/reviews.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

import * as fs from 'fs-extra';
import * as path from 'path';
import { PlacesAuthService } from '../places-auth/places-auth.service';

@Injectable()
export class PlacesReviewsService {
  private readonly logger = new Logger(PlacesReviewsService.name);
  private mybusiness: any;
  private mybusinessInfo: any;

  constructor(private authService: PlacesAuthService) {}

  private async initializeApis() {
    // Asegúrate de tener tokens válidos
    const tokens = await this.authService.refreshTokensIfNeeded();
    if (!tokens) {
      throw new Error('No hay tokens disponibles. Por favor, autentícate primero.');
    }

    // Configura el cliente OAuth con los tokens
    const oauth2Client = this.authService.getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Inicializa las APIs de Google My Business
    this.mybusiness = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client,
    });

    this.mybusinessInfo = google.mybusinessplaceactions({
      version: 'v1',
      auth: oauth2Client,
    });
  }

  async getAccounts() {
    try {
      await this.initializeApis();

      const response = await this.mybusiness.accounts.list({});
      const accounts = response.data.accounts || [];

      this.logger.log(`Se encontraron ${accounts.length} cuentas`);
      return accounts;
    } catch (error) {
      this.logger.error(`Error al obtener cuentas: ${error.message}`);
      throw error;
    }
  }

  async getLocations(accountName: string) {
    try {
      await this.initializeApis();

      const mybusinessInfo = google.mybusinessbusinessinformation({
        version: 'v1',
        auth: this.authService.getOAuth2Client(),
      });

      const response = await mybusinessInfo.accounts.locations.list({
        parent: accountName,
        pageSize: 100,
      });

      const locations = response.data.locations || [];
      this.logger.log(`Se encontraron ${locations.length} ubicaciones para la cuenta ${accountName}`);

      return locations;
    } catch (error) {
      this.logger.error(`Error al obtener ubicaciones: ${error.message}`);
      throw error;
    }
  }

  async getAllReviews(locationName: string, maxReviews = 1000) {
    try {
      await this.initializeApis();

      const mybusinessReviews = google.mybusinessplaceactions({
        version: 'v1',
        auth: this.authService.getOAuth2Client(),
      });

      let reviews = [];
      let pageToken = undefined;

      do {
        this.logger.log(`Obteniendo página de reseñas ${pageToken ? 'con token' : 'inicial'}`);

        const response = await mybusinessReviews.locations..list({
          parent: locationName,
          pageSize: 50,
          pageToken: pageToken,
        });

        const batchReviews = response.data.reviews || [];
        this.logger.log(`Obtenidas ${batchReviews.length} reseñas en esta página`);

        reviews = [...reviews, ...batchReviews];
        pageToken = response.data.nextPageToken;

        if (reviews.length >= maxReviews) {
          break;
        }
      } while (pageToken);

      this.logger.log(`Total de reseñas obtenidas: ${reviews.length}`);

      // Guardar reseñas en un archivo para uso posterior
      const reviewsDir = path.join(process.cwd(), 'data');
      fs.ensureDirSync(reviewsDir);

      const formattedReviews = reviews.map(review => ({
        reviewId: review.name,
        reviewer: review.reviewer?.displayName || 'Anónimo',
        starRating: review.starRating,
        comment: review.comment,
        createTime: review.createTime,
        updateTime: review.updateTime,
        hasResponse: !!review.reviewReply,
      }));

      const reviewsFile = path.join(reviewsDir, `${locationName.replace(/\//g, '_')}_reviews.json`);
      await fs.writeJson(reviewsFile, formattedReviews, { spaces: 2 });

      this.logger.log(`Reseñas guardadas en: ${reviewsFile}`);

      return formattedReviews.slice(0, maxReviews);
    } catch (error) {
      this.logger.error(`Error al obtener reseñas: ${error.message}`);
      throw error;
    }
  }
}
