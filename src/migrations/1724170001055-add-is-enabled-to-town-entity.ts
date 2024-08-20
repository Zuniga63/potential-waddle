import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsEnabledToTownEntity1724170001055 implements MigrationInterface {
  name = 'AddIsEnabledToTownEntity1724170001055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town" ADD "is_enable" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town" DROP COLUMN "is_enable"`);
  }
}
