import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCapacityColumnToLodging1740152670236 implements MigrationInterface {
  name = 'AddCapacityColumnToLodging1740152670236';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ADD "capacity" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "capacity"`);
  }
}
