import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an internal-only `file_hash` column to the `menu` table for idempotency.
 * The hash (sha256 of the uploaded file buffer) is stored per-row so that a
 * duplicate upload (same restaurantId + file_hash) can return the existing
 * completed menu without triggering a second (billable) extraction.
 *
 * Column is nullable — existing rows receive NULL (no backfill required).
 * The composite index (restaurant_id, file_hash) supports the idempotency lookup.
 *
 * INTERNAL ONLY: file_hash is never exposed through MenuDto.
 */
export class AddMenuFileHash1774400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu" ADD COLUMN "file_hash" text`);
    await queryRunner.query(
      `CREATE INDEX "idx_menu_restaurant_file_hash" ON "menu" ("restaurant_id", "file_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_menu_restaurant_file_hash"`);
    await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "file_hash"`);
  }
}
