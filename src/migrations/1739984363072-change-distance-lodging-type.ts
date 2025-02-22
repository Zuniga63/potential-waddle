import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeDistanceLodgingType1739984363072 implements MigrationInterface {
  name = 'ChangeDistanceLodgingType1739984363072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ALTER COLUMN "urban_center_distance" TYPE integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ALTER COLUMN "urban_center_distance" TYPE smallint`);
  }
}
