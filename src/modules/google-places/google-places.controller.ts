import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GooglePlacesService } from './google-places.service';
import { SwaggerTags } from 'src/config';
import { RemoveGooglePlaceIdDto } from './dto/remove-google-place-id.dto';

@Controller('google-places')
@ApiTags(SwaggerTags.GooglePlaces)
export class GooglePlacesController {
  constructor(private readonly googlePlacesService: GooglePlacesService) {}

  @Post('update-all-lodgings')
  @ApiOkResponse({
    description: 'Todos los lugares actualizados correctamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Todos los lugares actualizados correctamente' },
      },
    },
  })
  updateAllPlaces() {
    return this.googlePlacesService.updateAllLodgings();
  }

  @Post('update-all-commerces')
  @ApiOkResponse({
    description: 'Todos los lugares actualizados correctamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Todos los lugares actualizados correctamente' },
      },
    },
  })
  updateAllCommerces() {
    return this.googlePlacesService.updateAllCommerces();
  }

  @Post('update-all-restaurants')
  @ApiOkResponse({
    description: 'Todos los lugares actualizados correctamente',
    schema: {
      type: 'object',
    },
  })
  updateAllRestaurants() {
    return this.googlePlacesService.updateAllRestaurants();
  }

  @Patch('remove-google-place-id')
  @ApiOkResponse({
    description: 'Google Place ID removed correctly',
  })
  removeGooglePlaceId(@Body() body: RemoveGooglePlaceIdDto) {
    return this.googlePlacesService.removeGooglePlaceId(body.placeId, body.model);
  }
}
