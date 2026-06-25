import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `last_google_sync_at` (timestamptz, nullable) to the three entity tables
 * that participate in Google Reviews sync: lodging, restaurant, commerce.
 *
 * This column acts as the incremental-sync cursor:
 * - Set to NOW() at the end of each successful sync run.
 * - Read by GoogleSyncService to fetch only reviews newer than this timestamp.
 * - Also drives the server-side cooldown gate (last_google_sync_at > NOW() - 1h → 429).
 */
export class AddLastGoogleSyncAt1775100000000 implements MigrationInterface {
  private readonly tables = ['lodging', 'restaurant', 'commerce'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "last_google_sync_at" timestamptz`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "last_google_sync_at"`);
    }
  }
}
