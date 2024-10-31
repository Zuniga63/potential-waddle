import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAmenitiesColumnToLodgingTable1730417008786 implements MigrationInterface {
  name = 'AddAmenitiesColumnToLodgingTable1730417008786';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ADD "amenities" text array NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "amenities"`);
  }
}
