import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a `menu_url` column to the `restaurant` table.
 * Holds the public URL of the restaurant's menu/carta shown on the detail page:
 * auto-filled with the uploaded file's public URL on menu upload, or set
 * manually to an external link (interactive menu or existing PDF).
 *
 * Column is nullable — existing rows receive NULL (no backfill required).
 */
export class AddRestaurantMenuUrl1774500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" ADD COLUMN "menu_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "menu_url"`);
  }
}
