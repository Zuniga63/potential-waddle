import { Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

import { CloudinaryPresets } from 'src/config';

export async function createPlacePreset() {
  const presetName = CloudinaryPresets.PLACE_PHOTO;
  const logger = new Logger('Cloudinary');

  let message = '';

  try {
    const preset = await cloudinary.api.create_upload_preset({
      name: presetName,
      folder: 'places',
      resource_type: 'image',
      allowed_formats: 'jpg, png, gif, webp, bmp, jpe, jpeg',
      access_mode: 'public',
      unique_filename: true,
      auto_tagging: 0.7,
      overwrite: true,

      transformation: [{ width: 1080, crop: 'scale', dpr: 'auto', quality: 'auto:best' }],
    });

    message = preset.message;
    logger.log(`Preset ${presetName} created successfully`);
  } catch (error: any) {
    if (error.error && typeof error.error.message === 'string') {
      logger.error(error.error.message);
      message = error.error.message;
    }
  }

  return {
    name: presetName,
    message,
  };
}
