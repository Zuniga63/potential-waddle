import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Schema changes for the Google Reviews sync engine (Plan 20-02):
 *
 * 1. Creates `google_review_sync_log` audit table.
 * 2. Adds a composite index on (entity_type, entity_id, started_at DESC).
 * 3. Purges rows in `google_review` where review_id IS NULL (D-04).
 *    IRREVERSIBLE — NULL-review_id rows carry no resolvable data.
 * 4. Creates a partial unique index on `google_review.review_id` WHERE NOT NULL,
 *    enabling ON CONFLICT (review_id) UPSERT in GoogleSyncService (Plan 20-04).
 * 5. Drops the `pinecone_id` column from `google_review` (D-05).
 *    IRREVERSIBLE — createReviewVector was never called in prod so all values are NULL.
 *    Plan 20-05 gates prod with: SELECT COUNT(*) FROM google_review WHERE pinecone_id IS NOT NULL (expect 0).
 */
export class AddGoogleReviewSyncLog1775000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create audit/log table
    await queryRunner.query(`
      CREATE TABLE "google_review_sync_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "entity_type" varchar(50) NOT NULL,
        "entity_id" uuid NOT NULL,
        "trigger" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'running',
        "started_at" timestamptz NOT NULL DEFAULT NOW(),
        "ended_at" timestamptz,
        "reviews_new" integer,
        "reviews_total" integer,
        "error_message" text,
        "created_at" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    // 2. Composite index for history queries by entity + time
    await queryRunner.query(`
      CREATE INDEX "IDX_google_review_sync_log_entity_started"
      ON "google_review_sync_log" ("entity_type", "entity_id", "started_at" DESC)
    `);

    // 3. Purge NULL review_id rows (D-04) — IRREVERSIBLE
    await queryRunner.query(`DELETE FROM "google_review" WHERE "review_id" IS NULL`);

    // 4. Partial unique index to enable ON CONFLICT (review_id) UPSERT
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_google_review_review_id"
      ON "google_review" ("review_id")
      WHERE "review_id" IS NOT NULL
    `);

    // 5. Drop pinecone_id column (D-05) — IRREVERSIBLE (all prod values are NULL)
    await queryRunner.query(`ALTER TABLE "google_review" DROP COLUMN IF EXISTS "pinecone_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore pinecone_id column (values NOT recoverable — were already NULL in prod)
    await queryRunner.query(`ALTER TABLE "google_review" ADD COLUMN "pinecone_id" varchar`);

    // Drop the unique index (review_id partial)
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_google_review_review_id"`);

    // NOTE: The NULL review_id purge (step 3 above) is NOT recoverable in down().
    // Those rows had no resolvable review_id and cannot be reconstructed.

    // Drop sync log table
    await queryRunner.query(`DROP TABLE IF EXISTS "google_review_sync_log"`);
  }
}
