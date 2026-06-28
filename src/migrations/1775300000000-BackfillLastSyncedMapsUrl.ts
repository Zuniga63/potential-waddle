import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills `last_synced_maps_url` for entities that already synced before the
 * column existed (migration 1775200000000 added it as NULL).
 *
 * Without a baseline, GoogleSyncService cannot detect a place-URL change on the
 * FIRST sync after deploy — it has nothing to compare against, so it does a safe
 * incremental pull and only then records the baseline. That means a business the
 * owner re-points right after deploy would not get the clean full resync.
 *
 * Seeding the baseline with the current `google_maps_url` (the URL the last sync
 * necessarily pulled from) closes that gap: any subsequent URL change is
 * detected from sync #1. Only rows that have actually synced
 * (`last_google_sync_at IS NOT NULL`) and still lack a baseline are touched.
 */
export class BackfillLastSyncedMapsUrl1775300000000 implements MigrationInterface {
  private readonly tables = ['lodging', 'restaurant', 'commerce'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `UPDATE "${table}"
         SET "last_synced_maps_url" = "google_maps_url"
         WHERE "last_synced_maps_url" IS NULL
           AND "last_google_sync_at" IS NOT NULL
           AND "google_maps_url" IS NOT NULL`,
      );
    }
  }

  public async down(): Promise<void> {
    // Non-reversible data backfill — leaving the seeded values in place on revert
    // is harmless (they match the URL the entity already synced from).
  }
}
