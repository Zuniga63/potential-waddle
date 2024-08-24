import { AdminApiOptions } from 'cloudinary';

import { CloudinaryPresets } from 'src/config';
import { createPreset, updatePreset, verifyIfPresetExist } from '../logic';

export async function createProfilePhotosPreset(folder = 'profile_photos') {
  const name = CloudinaryPresets.PROFILE_PHOTO;

  const options: AdminApiOptions = {
    name,
    folder,
    resource_type: 'image',
    allowed_formats: 'jpg, png, gif, webp, bmp, jpe, jpeg',
    access_mode: 'public',
    unique_filename: true,
    auto_tagging: 0.7,
    overwrite: true,

    transformation: [{ width: 200, height: 200, crop: 'thumb', gravity: 'face' }],
  };

  const presetExist = await verifyIfPresetExist(name);

  if (presetExist) {
    const { message } = await updatePreset({ options });
    return { name, message };
  }

  const { message } = await createPreset({ options });
  return { name, message };
}
