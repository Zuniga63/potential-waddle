import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Restaurant didn't have a status workflow at all — public list endpoints were
 * filtering with `isPublic: true`, owner had no submit-for-review concept, and
 * admin had no approve/reject path. This migration brings Restaurant to parity
 * with Lodging + Commerce in one go:
 *
 *   - status enum (draft|pending_review|published|rejected, default 'draft')
 *   - submitted_at + rejection_reason for the workflow trail
 *   - menu_not_applicable boolean (street food, no formal menu — analogous to
 *     lodging.rooms_not_applicable; the Menu bucket of the completion compute
 *     is treated as satisfied when this flag is true)
 *   - skipped_optional_fields text[] for the persisted "No tengo" wizard state
 *
 * Existing rows are backfilled to 'published' so they keep appearing in public
 * lists once the public read path switches to `WHERE status='published'`. Same
 * backfill pattern as AddCommerceStatusWorkflow.
 */
export class AddRestaurantStatusWorkflowAndSkipState1773800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Status enum + workflow columns
    await queryRunner.query(
      `CREATE TYPE "restaurant_status" AS ENUM('draft', 'pending_review', 'published', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant" ADD COLUMN "status" "restaurant_status" NOT NULL DEFAULT 'draft'`,
    );
    // Backfill existing rows to 'published' so they don't disappear from public lists
    await queryRunner.query(`UPDATE "restaurant" SET "status" = 'published' WHERE "status" = 'draft'`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD COLUMN "submitted_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD COLUMN "rejection_reason" text`);

    // Status index for admin filtering
    await queryRunner.query(`CREATE INDEX "idx_restaurant_status" ON "restaurant" ("status")`);

    // Owner-opt-out flag for the Menu bucket (analogous to lodging.rooms_not_applicable)
    await queryRunner.query(`ALTER TABLE "restaurant" ADD COLUMN "menu_not_applicable" boolean NOT NULL DEFAULT false`);

    // Persisted skip state (see AddLodgingSkippedOptionalFields docblock for design)
    await queryRunner.query(
      `ALTER TABLE "restaurant" ADD COLUMN "skipped_optional_fields" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "skipped_optional_fields"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "menu_not_applicable"`);
    await queryRunner.query(`DROP INDEX "idx_restaurant_status"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "submitted_at"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "restaurant_status"`);
  }
}
