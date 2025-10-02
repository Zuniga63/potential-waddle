import { Controller, Get, Query } from '@nestjs/common';
import { MapService } from './map.service';
import { GetNearbyPlacesDto } from './dto/get-nearby-places.dto';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('nearby')
  async getNearbyPlaces(@Query() query: GetNearbyPlacesDto) {
    const { latitude, longitude, radius = 10, types } = query;

    const places = await this.mapService.getNearbyPlaces(
      latitude,
      longitude,
      radius,
      types,
    );

    return {
      success: true,
      count: places.length,
      radius: radius,
      center: { latitude, longitude },
      places,
    };
  }
}
