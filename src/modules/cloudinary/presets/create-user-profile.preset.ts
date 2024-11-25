import { AdminApiOptions } from 'cloudinary';

import { CloudinaryPresets } from 'src/config';
import { createPreset, updatePreset, verifyIfPresetExist } from '../logic';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';

export async function createProfilePhotosPreset() {
  const name = CloudinaryPresets.PROFILE_PHOTO;

  const options: AdminApiOptions = {
    name,
    folder: CLOUDINARY_FOLDERS.USER_PROFILE,
    resource_type: 'image',
    allowed_formats: 'jpg, png, gif, webp, bmp, jpe, jpeg',
    access_mode: 'public',
    unique_filename: true,
    auto_tagging: 0.7,
    overwrite: true,

    transformation: [{ width: 200, height: 200, crop: 'thumb' }],
  };

  const presetExist = await verifyIfPresetExist(name);

  if (presetExist) {
    const { message } = await updatePreset({ options });
    return { name, message };
  }

  const { message } = await createPreset({ options });
  return { name, message };
}
