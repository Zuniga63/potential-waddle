import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Guide didn't have a status workflow — only `isPublic`. This migration brings
 * Guide to parity with Lodging + Restaurant + Commerce so admin can approve/reject
 * guides and owners can submit them for review.
 *
 *   - status enum (draft|pending_review|published|rejected, default 'draft')
 *   - submitted_at + rejection_reason for the workflow trail
 *   - skipped_optional_fields text[] for the persisted "No tengo" wizard state
 *
 * Existing rows are backfilled to 'published' so they keep appearing in public
 * lists once the public read path switches to `WHERE status='published'`. Same
 * backfill pattern as AddRestaurantStatusWorkflowAndSkipState.
 */
export class AddGuideStatusWorkflowAndSkipState1774000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "guide_status" AS ENUM('draft', 'pending_review', 'published', 'rejected')`);
    await queryRunner.query(`ALTER TABLE "guide" ADD COLUMN "status" "guide_status" NOT NULL DEFAULT 'draft'`);
    await queryRunner.query(`UPDATE "guide" SET "status" = 'published' WHERE "status" = 'draft'`);
    await queryRunner.query(`ALTER TABLE "guide" ADD COLUMN "submitted_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "guide" ADD COLUMN "rejection_reason" text`);

    await queryRunner.query(`CREATE INDEX "idx_guide_status" ON "guide" ("status")`);

    await queryRunner.query(`ALTER TABLE "guide" ADD COLUMN "skipped_optional_fields" text[] NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "skipped_optional_fields"`);
    await queryRunner.query(`DROP INDEX "idx_guide_status"`);
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "submitted_at"`);
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "guide_status"`);
  }
}
