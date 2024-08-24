import { Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export async function verifyIfPresetExist(presetName: string): Promise<boolean> {
  const logger = new Logger(`Verifying the existence of the preset ${presetName}`);
  return cloudinary.api
    .upload_preset(presetName)
    .then(() => true)
    .catch(({ error }: { error: { message: string; http_code: number } }) => {
      logger.log(error.message);
      if (error.http_code === 404) return false;
      throw error;
    });
}
