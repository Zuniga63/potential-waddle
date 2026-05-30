import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the same status workflow lodging has (Phase 4) to the commerce table.
 *
 * - status enum: draft | pending_review | published | rejected
 * - new rows default to 'draft'; existing rows are backfilled to 'published'
 *   so live commerces don't disappear from public listings
 * - submitted_at + rejection_reason timestamps to track lifecycle transitions
 */
export class AddCommerceStatusWorkflow1773500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."commerce_status" AS ENUM ('draft', 'pending_review', 'published', 'rejected')`,
    );

    await queryRunner.query(
      `ALTER TABLE "commerce" ADD COLUMN "status" "public"."commerce_status" NOT NULL DEFAULT 'draft'`,
    );

    // Existing commerces were already visible via isPublic — keep them published.
    await queryRunner.query(`UPDATE "commerce" SET "status" = 'published'`);

    await queryRunner.query(`CREATE INDEX "IDX_commerce_status" ON "commerce" ("status")`);

    await queryRunner.query(`ALTER TABLE "commerce" ADD COLUMN "submitted_at" timestamp NULL`);
    await queryRunner.query(`ALTER TABLE "commerce" ADD COLUMN "rejection_reason" text NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_commerce_status"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "submitted_at"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."commerce_status"`);
  }
}
