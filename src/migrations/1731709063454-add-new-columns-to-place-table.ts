import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToPlaceTable1731709063454 implements MigrationInterface {
  name = 'AddNewColumnsToPlaceTable1731709063454';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" ADD "is_featured" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "place" ADD "show_location" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "show_location"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "is_featured"`);
  }
}
