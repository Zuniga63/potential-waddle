import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PlacesReviewsService } from './places-reviews.service';

@Controller('reviews')
export class PlacesReviewsController {
  constructor(private readonly reviewsService: PlacesReviewsService) {}

  @Get('accounts')
  async getAccounts() {
    try {
      return await this.reviewsService.getAccounts();
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `Error al obtener cuentas: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('accounts/:accountName/locations')
  async getLocations(@Param('accountName') accountName: string) {
    try {
      return await this.reviewsService.getLocations(accountName);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `Error al obtener ubicaciones: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('locations/:locationName/reviews')
  async getReviews(@Param('locationName') locationName: string, @Query('maxReviews') maxReviews: number) {
    try {
      // Formatear nombre de ubicación si es necesario
      const formattedLocationName = locationName.startsWith('locations/') ? locationName : `locations/${locationName}`;

      return await this.reviewsService.getAllReviews(
        formattedLocationName,
        maxReviews ? parseInt(maxReviews.toString()) : 1000,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `Error al obtener reseñas: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
