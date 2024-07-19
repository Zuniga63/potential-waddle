import { Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

import { Auth } from '../auth/decorators';
import { AppPermissions, SwaggerTags } from 'src/config';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
@ApiTags(SwaggerTags.Cloudinary)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('install-presets')
  @Auth(AppPermissions.INSTALL_CLOUDINARY_PRESETS)
  @ApiCreatedResponse({
    description: 'Return the Cloudinary API response for create presets',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'cloudinary-preset-name' },
        message: {
          type: 'string',
          example: 'created or the message "name has been taken"',
        },
      },
    },
  })
  async installPressets() {
    return this.cloudinaryService.createPresets();
  }
}
