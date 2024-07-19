import { Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { UploadApiOptions, UploadApiResponse, v2 as cloudinary } from 'cloudinary';

import { createSlug } from 'src/utils';
import { bufferToStream } from './utils';
import { CloudinaryPresets } from 'src/config';
import { CloudinaryImage } from './interfaces';
import { createProfilePhotosPreset } from './presets';
import { createCloudinaryImageAdapter } from './adapters';

interface UploadImageProps {
  file: Express.Multer.File;
  fileName?: string;
  preset?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger('CloudinaryService');

  async uploadImage({
    file,
    fileName,
    preset = CloudinaryPresets.DEFAULT,
  }: UploadImageProps): Promise<CloudinaryImage | undefined> {
    console.log(file);
    const { mimetype } = file;
    const [fileType] = mimetype.split('/') as ['image' | 'video' | 'raw' | 'auto' | undefined];
    const options: UploadApiOptions = { upload_preset: preset, resource_type: fileType };

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
  ): Promise<CloudinaryImage | undefined> {
    const options: UploadApiOptions = { upload_preset: preset };

    if (fileName) {
      options.public_id = this.createUniqueFileName(fileName);
    }

    const uploadedFile = await cloudinary.uploader.upload(url, options);
    return createCloudinaryImageAdapter(uploadedFile);
  }

  async createPresets() {
    const promises = await Promise.all([createProfilePhotosPreset()]);
    return promises;
  }

  async destroyFile(publicId: string) {
    try {
      const cloudRes = await cloudinary.uploader.destroy(publicId);
      this.logger.log(cloudRes);
      return true;
    } catch (error) {
      this.logger.error(error);
    }

    return false;
  }

  private createUniqueFileName(fileName: string) {
    const name = encodeURIComponent(createSlug(fileName));
    const id = nanoid(10);

    return `${name}-${id}`;
  }
}
