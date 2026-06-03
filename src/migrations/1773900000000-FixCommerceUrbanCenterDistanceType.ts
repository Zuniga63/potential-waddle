import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix: commerce.urban_center_distance was smallint (max 32767), which overflows
 * for distances ≥ ~32 km expressed in meters (e.g. 111880m = 111.88 km).
 * Lodgings and restaurants already use integer for the same column; this migration
 * brings commerce in line.
 *
 * Postgres can cast smallint → integer without data loss in-place, so this is
 * O(1) on the catalog (no row rewrite).
 *
 * Down: integer → smallint may truncate. Migration is conditional: skip the
 * down if any row exceeds the smallint range, otherwise risk silent data loss.
 */
export class FixCommerceUrbanCenterDistanceType1773900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commerce" ALTER COLUMN "urban_center_distance" TYPE integer USING "urban_center_distance"::integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Refuse the down if any row would lose precision.
    const overflow = await queryRunner.query(
      `SELECT COUNT(*)::int AS c FROM "commerce" WHERE "urban_center_distance" IS NOT NULL AND "urban_center_distance" > 32767`,
    );
    if (overflow?.[0]?.c > 0) {
      throw new Error(
        `Cannot revert: ${overflow[0].c} commerce row(s) have urban_center_distance > 32767. ` +
          `Update those rows first or accept data loss before running down.`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "commerce" ALTER COLUMN "urban_center_distance" TYPE smallint USING "urban_center_distance"::smallint`,
    );
  }
}
