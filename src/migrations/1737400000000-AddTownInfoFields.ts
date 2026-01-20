import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTownInfoFields1737400000000 implements MigrationInterface {
  name = 'AddTownInfoFields1737400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to town_info table
    await queryRunner.query(`
      ALTER TABLE "town_info" ADD COLUMN IF NOT EXISTS "population" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "town_info" ADD COLUMN IF NOT EXISTS "distance_to_capital" text
    `);

    await queryRunner.query(`
      ALTER TABLE "town_info" ADD COLUMN IF NOT EXISTS "ubication" text
    `);

    await queryRunner.query(`
      ALTER TABLE "town_info" ADD COLUMN IF NOT EXISTS "official_name" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town_info" DROP COLUMN IF EXISTS "official_name"`);
    await queryRunner.query(`ALTER TABLE "town_info" DROP COLUMN IF EXISTS "ubication"`);
    await queryRunner.query(`ALTER TABLE "town_info" DROP COLUMN IF EXISTS "distance_to_capital"`);
    await queryRunner.query(`ALTER TABLE "town_info" DROP COLUMN IF EXISTS "population"`);
  }
}
