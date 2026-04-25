import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLodgingPriceUnit1772000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ADD "price_unit" text NOT NULL DEFAULT 'noche'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "price_unit"`);
  }
}
