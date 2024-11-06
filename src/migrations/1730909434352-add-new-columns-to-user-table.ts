import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToUserTable1730909434352 implements MigrationInterface {
  name = 'AddNewColumnsToUserTable1730909434352';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "birth_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "country" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "country_state" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "city" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country_state"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birth_date"`);
  }
}
