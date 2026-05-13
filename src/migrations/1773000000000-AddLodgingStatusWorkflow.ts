import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLodgingStatusWorkflow1773000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // * ----------------------------------------------------------------------------------------------------------------
    // * ENUM TYPE
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(
      `CREATE TYPE "public"."lodging_status" AS ENUM ('draft', 'pending_review', 'published', 'rejected')`,
    );

    // * ----------------------------------------------------------------------------------------------------------------
    // * STATUS COLUMN (default 'draft' for new rows)
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(
      `ALTER TABLE "lodging" ADD COLUMN "status" "public"."lodging_status" NOT NULL DEFAULT 'draft'`,
    );

    // * ----------------------------------------------------------------------------------------------------------------
    // * BACKFILL — all existing lodgings were visible via isPublic, keep them published
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(`UPDATE "lodging" SET "status" = 'published'`);

    // * ----------------------------------------------------------------------------------------------------------------
    // * INDEX ON STATUS
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(`CREATE INDEX "IDX_lodging_status" ON "lodging" ("status")`);

    // * ----------------------------------------------------------------------------------------------------------------
    // * TRANSITION TIMESTAMP COLUMNS
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(`ALTER TABLE "lodging" ADD COLUMN "submitted_at" timestamp NULL`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD COLUMN "rejection_reason" text NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse order: index → columns → enum type
    await queryRunner.query(`DROP INDEX "public"."IDX_lodging_status"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "submitted_at"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."lodging_status"`);
  }
}
