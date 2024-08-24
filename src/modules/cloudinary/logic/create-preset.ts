import { type AdminApiOptions, v2 as cloudinary } from 'cloudinary';

interface Params {
  options: AdminApiOptions;
}

interface CreatePresetResponse {
  message: string;
}

export async function createPreset({ options }: Params): Promise<CreatePresetResponse> {
  let message = '';

  try {
    await cloudinary.api.create_upload_preset(options);
    message = `Preset ${options.name} is created successfully.`;
  } catch (error) {
    message = `Error ${options.name}: ${error.message}. Trying to delete and recreate...`;
  }

  return { message };
}
