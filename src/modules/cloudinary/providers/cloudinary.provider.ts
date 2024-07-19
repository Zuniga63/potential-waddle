import { ConfigService } from '@nestjs/config';
import { v2 } from 'cloudinary';

import { EnvironmentVariables } from 'src/config';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (config: ConfigService<EnvironmentVariables>) => {
    return v2.config({
      cloud_name: config.get('cloudinary.cloudName', { infer: true }),
      api_key: config.get('cloudinary.apiKey', { infer: true }),
      api_secret: config.get('cloudinary.apiSecret', { infer: true }),
    });
  },
  inject: [ConfigService],
};
