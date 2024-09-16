import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToLodgingTable1726497162426 implements MigrationInterface {
  name = 'AddNewColumnsToLodgingTable1726497162426';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "room_types" text array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "phones" text array DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "facebook" text`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "instagram" text`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "whatapps" text array DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "whatapps"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "instagram"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "facebook"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "phones"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "room_types"`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "phone" text`);
  }
}
