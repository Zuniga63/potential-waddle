import type { QueryRunner } from 'typeorm';

interface Params {
  queryRunner: QueryRunner;
  addImageToDelete: (id: string) => void;
  logger: (message: string, level?: number) => void;
  level?: number;
}

interface ProfilePhoto {
  profile_photo: { publicId: string } | null;
}

interface ImageResource {
  public_id: string | null;
}

export async function truncateTables({ queryRunner, addImageToDelete, logger, level = 0 }: Params) {
  logger('Truncating tables...', level);
  logger('Getting tables...', level + 1);
  const tables = await getTables({ queryRunner });

  logger('Getting images and add to global group...', level + 1);
  const images = await getImagesToDelete({ queryRunner });
  images.forEach(publicId => addImageToDelete(publicId));

  logger('Disabling foreign key constraints', level + 1);
  await queryRunner.query('SET session_replication_role = replica;');

  for (const { table_name } of tables) {
    logger(`Truncating table ${table_name}`, level + 1);
    await queryRunner.query(`TRUNCATE TABLE "${table_name}" RESTART IDENTITY CASCADE;`);
  }

  logger('Enabling foreign key constraints', level + 1);
  await queryRunner.query('SET session_replication_role = DEFAULT;');

  logger('Truncate tables completed.', level + 1);
}

async function getTables({ queryRunner }: Pick<Params, 'queryRunner'>): Promise<{ table_name: string }[]> {
  const query = `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name != 'migrations'`;

  return queryRunner.query(query) as Promise<{ table_name: string }[]>;
}

async function getImagesToDelete({ queryRunner }: Pick<Params, 'queryRunner'>): Promise<string[]> {
  const images: string[] = [];

  const [userImages, imageResources]: [ProfilePhoto[], ImageResource[]] = await Promise.all([
    queryRunner.query('SELECT profile_photo FROM users'),
    queryRunner.query('SELECT public_id FROM image_resource'),
  ]);

  userImages.forEach(({ profile_photo }) => {
    if (profile_photo) images.push(profile_photo.publicId);
  });

  imageResources.forEach(({ public_id }) => {
    if (public_id) images.push(public_id);
  });

  return images;
}
