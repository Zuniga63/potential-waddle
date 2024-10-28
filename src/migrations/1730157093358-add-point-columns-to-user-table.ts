import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPointColumnsToUserTable1730157093358 implements MigrationInterface {
  name = 'AddPointColumnsToUserTable1730157093358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "total_points" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "remaining_points" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "ranking_points" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "ranking_points"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "remaining_points"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "total_points"`);
  }
}
