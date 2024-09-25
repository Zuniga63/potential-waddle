import { AdminApiOptions } from 'cloudinary';

import { CloudinaryPresets } from 'src/config';
import { createPreset, updatePreset, verifyIfPresetExist } from '../logic';

export async function createExperiencePreset() {
  const name = CloudinaryPresets.EXPERIENCE_IMAGE;

  const options: AdminApiOptions = {
    name,
    folder: 'experience_gallery',
    resource_type: 'image',
    allowed_formats: 'jpg, png, gif, webp, bmp, jpe, jpeg',
    access_mode: 'public',
    unique_filename: true,
    auto_tagging: 0.7,
    overwrite: true,
    format: 'jpg',

    transformation: [{ width: 1080, crop: 'scale', dpr: 'auto', quality: 'auto:best' }],
  };

  const presetExist = await verifyIfPresetExist(name);

  if (presetExist) {
    const { message } = await updatePreset({ options });
    return { name, message };
  }

  const { message } = await createPreset({ options });
  return { name, message };
}
