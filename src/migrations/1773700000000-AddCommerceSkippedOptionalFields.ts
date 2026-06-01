import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mirror of AddLodgingSkippedOptionalFields1773600000000 for the commerce entity.
 * Persists the "No tengo / No aplica" wizard affordance so it survives logout.
 * See the lodging migration's docblock for the rationale (single text[] column
 * instead of per-field sentinels — handles heterogeneous types uniformly).
 */
export class AddCommerceSkippedOptionalFields1773700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commerce" ADD COLUMN "skipped_optional_fields" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "skipped_optional_fields"`);
  }
}
