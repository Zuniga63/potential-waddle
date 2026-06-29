import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `binntu_review_summary` table for persisting AI-generated
 * structured review analysis (StructuredReviewAnalysis JSON) for Binntu reviews.
 *
 * - `content` stores the raw JSON string returned by Gemini.
 * - `review_count_at_generation` backs the D-10 "N nuevas desde el último análisis" delta.
 * - `generated_at` defaults to now() and is indexed with entity_type + entity_id.
 *
 * IMPORTANT: Run `npm run migration:run` against the target DB before deploying
 * Plan 24-05 (frontend structured render). The TypeORM entity compiles without
 * the table existing — migration:run is the only way to verify the table is created.
 */
export class AddBinntuReviewSummary1775400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "binntu_review_summary" (
        "id"                          uuid DEFAULT uuid_generate_v4() NOT NULL,
        "entity_type"                 character varying                NOT NULL,
        "entity_id"                   character varying                NOT NULL,
        "content"                     text                             NOT NULL,
        "review_count_at_generation"  integer                          NOT NULL,
        "generated_at"                timestamp DEFAULT now()           NOT NULL,
        CONSTRAINT "PK_binntu_review_summary" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_binntu_review_summary_entity"
        ON "binntu_review_summary" ("entity_type", "entity_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_binntu_review_summary_entity"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "binntu_review_summary"`);
  }
}
