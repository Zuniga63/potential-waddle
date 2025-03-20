import { Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GooglePlacesService } from './google-places.service';
import { SwaggerTags } from 'src/config';

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
}
