import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePlacePointsColumns1728578428081 implements MigrationInterface {
  name = 'UpdatePlacePointsColumns1728578428081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" ADD "base_points" double precision NOT NULL DEFAULT '100'`);
    await queryRunner.query(
      `ALTER TABLE "place" ALTER COLUMN "points" TYPE double precision USING "points"::double precision`,
    );
    await queryRunner.query(`ALTER TABLE "place" ALTER COLUMN "points" SET DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the changes made to 'points' column
    await queryRunner.query(`ALTER TABLE "place" ALTER COLUMN "points" TYPE smallint USING "points"::smallint`);
    await queryRunner.query(`ALTER TABLE "place" ALTER COLUMN "points" SET DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "base_points"`);
  }
}
