import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Experience didn't have a status workflow — only `isPublic`. This migration brings
 * Experience to parity with Lodging + Restaurant + Commerce + Guide so admin can
 * approve/reject each experience and owners can submit them for review (after their
 * guide has been approved).
 *
 *   - status enum (draft|pending_review|published|rejected, default 'draft')
 *   - submitted_at + rejection_reason for the workflow trail
 *   - skipped_optional_fields text[] for the persisted "No tengo" wizard state
 *
 * Existing rows are backfilled to 'published' so they keep appearing in public
 * lists once the public read path switches to `WHERE status='published'`. Same
 * backfill pattern as AddRestaurantStatusWorkflowAndSkipState.
 */
export class AddExperienceStatusWorkflowAndSkipState1774100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "experience_status" AS ENUM('draft', 'pending_review', 'published', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience" ADD COLUMN "status" "experience_status" NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(`UPDATE "experience" SET "status" = 'published' WHERE "status" = 'draft'`);
    await queryRunner.query(`ALTER TABLE "experience" ADD COLUMN "submitted_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "experience" ADD COLUMN "rejection_reason" text`);

    await queryRunner.query(`CREATE INDEX "idx_experience_status" ON "experience" ("status")`);

    await queryRunner.query(
      `ALTER TABLE "experience" ADD COLUMN "skipped_optional_fields" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "skipped_optional_fields"`);
    await queryRunner.query(`DROP INDEX "idx_experience_status"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "submitted_at"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "experience_status"`);
  }
}
