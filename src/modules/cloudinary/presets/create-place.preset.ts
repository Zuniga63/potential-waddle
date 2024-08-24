import { AdminApiOptions } from 'cloudinary';

import { CloudinaryPresets } from 'src/config';
import { createPreset, updatePreset, verifyIfPresetExist } from '../logic';

export async function createPlacePreset() {
  const name = CloudinaryPresets.PLACE_IMAGE;

  const options: AdminApiOptions = {
    name,
    folder: 'places',
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

  // try {
  //   await cloudinary.api.upload_preset(presetName);
  //   logger.log(`The preset ${presetName} already exists, updating...`);

  //   try {
  //     await cloudinary.api.update_upload_preset(presetName, options);
  //     message = `Preset ${presetName} updated successfully`;
  //   } catch (error) {
  //     logger.error(`Error al actualizar el preset ${presetName}: ${error.message}. Intentando eliminar y recrear...`);

  //     try {
  //       await cloudinary.api.delete_upload_preset(presetName);
  //       logger.log(`Preset ${presetName} eliminado exitosamente.`);

  //       await cloudinary.api.create_upload_preset(options);
  //       message = `Preset ${presetName} creado exitosamente después de eliminar.`;
  //     } catch (recreateError) {
  //       message = `Error al recrear el preset ${presetName}: ${recreateError.message}`;
  //     }
  //   }
  // } catch (error: any) {
  //   if (error.http_code === 404) {
  //     logger.log(`Preset ${presetName} no existe. Creando nuevo preset...`);

  //     const { message: createMessage } = await createPreset({ options });
  //     message = createMessage;
  //   } else {
  //     message = `Error al verificar la existencia del preset ${presetName}: ${error.message}`;
  //   }
  // }

  return { name: name, message };
}
