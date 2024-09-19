import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLodgingTableColumns1726704766711 implements MigrationInterface {
  name = 'UpdateLodgingTableColumns1726704766711';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ADD "urban_center_distance" smallint`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "language_spoken"`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "language_spoken" text array DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "language_spoken"`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "language_spoken" text`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "urban_center_distance"`);
  }
}
