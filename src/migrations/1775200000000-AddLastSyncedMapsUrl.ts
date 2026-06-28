import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `last_synced_maps_url` (text, nullable) to the three entity tables that
 * participate in Google Reviews sync: lodging, restaurant, commerce.
 *
 * This column records the `google_maps_url` that the LAST successful sync pulled
 * from. GoogleSyncService compares it against the entity's current
 * `google_maps_url`:
 * - If they differ, the owner re-pointed the business to a different Google
 *   place. The next sync is forced to behave like a first sync — wipe all
 *   existing reviews and do a full (non-incremental) pull from the new place —
 *   so the previous place's reviews never linger mixed in.
 * - The manual-sync cooldown is also bypassed when the URL changed, so the
 *   corrective re-sync is not blocked by the 1h window.
 */
export class AddLastSyncedMapsUrl1775200000000 implements MigrationInterface {
  private readonly tables = ['lodging', 'restaurant', 'commerce'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "last_synced_maps_url" text`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "last_synced_maps_url"`);
    }
  }
}
