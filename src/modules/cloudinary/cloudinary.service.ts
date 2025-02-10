import { Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  AdminAndResourceOptions,
  ResourceApiResponse,
  UploadApiOptions,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';

import { createSlug } from 'src/utils';
import { bufferToStream } from './utils';
import { CloudinaryPresets } from 'src/config';
import { CloudinaryImage } from './interfaces';
import {
  createExperiencePreset,
  createLodgingPreset,
  createPlacePreset,
  createProfilePhotosPreset,
  createRestaurantPreset,
  createReviewPreset,
} from './presets';
import { createCloudinaryImageAdapter } from './adapters';
import { createCommercePreset } from './presets/create-commerce.preset';
import { createGuidePreset } from './presets/create-guide.preste';

interface UploadImageProps {
  file: Express.Multer.File;
  fileName?: string;
  preset?: string;
  folder?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger('CloudinaryService');

  async uploadImage({
    file,
    fileName,
    preset = CloudinaryPresets.DEFAULT,
    folder,
  }: UploadImageProps): Promise<CloudinaryImage | undefined> {
    const { mimetype } = file;
    const [fileType] = mimetype.split('/') as ['image' | 'video' | 'raw' | 'auto' | undefined];
    const options: UploadApiOptions = { upload_preset: preset, resource_type: fileType, folder };

    if (fileName) {
      options.public_id = this.createUniqueFileName(fileName);
    }

    const uploadedFile = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });

      bufferToStream(file.buffer).pipe(upload);
    });

    return createCloudinaryImageAdapter(uploadedFile);
  }

  async uploadImageFromUrl(
    url: string,
    fileName?: string,
    preset = CloudinaryPresets.DEFAULT,
    folder?: string,
  ): Promise<CloudinaryImage | undefined> {
    const options: UploadApiOptions = { upload_preset: preset, folder };

    if (fileName) {
      options.public_id = this.createUniqueFileName(fileName);
    }

    const uploadedFile = await cloudinary.uploader.upload(url, options);
    return createCloudinaryImageAdapter(uploadedFile);
  }

  async createPresets() {
    const promises = await Promise.all([
      createProfilePhotosPreset(),
      createPlacePreset(),
      createLodgingPreset(),
      createExperiencePreset(),
      createRestaurantPreset(),
      createReviewPreset(),
      createCommercePreset(),
      createGuidePreset(),
    ]);
    return promises;
  }

  async destroyFile(publicId?: string) {
    if (!publicId) return false;

    try {
      const cloudRes = await cloudinary.uploader.destroy(publicId);
      return cloudRes.result === 'ok';
    } catch (error) {
      this.logger.error(`Error deleting file with publicId: ${publicId}`);
      console.log(error);
      return false;
    }
  }

  async getResourceFromFolder(
    folder: string,
    options: AdminAndResourceOptions = {},
  ): Promise<ResourceApiResponse | null> {
    try {
      return await cloudinary.api.resources_by_asset_folder(folder, options);
    } catch (error) {
      this.logger.error(error);
    }
    return null;
  }

  private createUniqueFileName(fileName: string) {
    const name = encodeURIComponent(createSlug(fileName));
    const id = nanoid(10);

    return `${name}-${id}`;
  }
}
