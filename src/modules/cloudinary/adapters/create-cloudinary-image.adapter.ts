import { type UploadApiResponse } from 'cloudinary';
import { CloudinaryImage } from '../interfaces';

export function createCloudinaryImageAdapter(uploadResponse?: UploadApiResponse): CloudinaryImage | undefined {
  if (!uploadResponse) return;

  const { public_id: publicId, width, height, format, resource_type: type, secure_url: url } = uploadResponse;
  return { publicId, width, height, format, type, url };
}
