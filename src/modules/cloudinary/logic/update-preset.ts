import { Logger } from '@nestjs/common';
import { type AdminApiOptions, v2 as cloudinary } from 'cloudinary';

interface Params {
  options: AdminApiOptions;
}

export async function updatePreset({ options }: Params): Promise<{ message: string }> {
  let message = '';
  const logger = new Logger(`Updatting Preset ${options.name}`);

  try {
    await cloudinary.api.update_upload_preset(options.name, options);
    message = `Preset ${options.name} updated successfully`;
  } catch (updateError) {
    logger.error(`Error updating: ${updateError.message}. Trying to delete and recreate...`);

    try {
      await cloudinary.api.delete_upload_preset(options.name);
      logger.log(`Delete is successfully.`);

      await cloudinary.api.create_upload_preset(options);
      message = `Created successfully after deletion.`;
    } catch (recreateError) {
      logger.error(`Error recreating: ${recreateError.message}`);
      throw recreateError;
    }
  }

  return { message };
}
