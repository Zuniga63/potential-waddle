import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUrbanAreaAndDeleteUrlComlum1729521623305 implements MigrationInterface {
  name = 'AddUrbanAreaAndDeleteUrlComlum1729521623305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town" DROP COLUMN "url"`);
    await queryRunner.query(`ALTER TABLE "town" ADD "code" text`);
    await queryRunner.query(`ALTER TABLE "town" ADD CONSTRAINT "UQ_a4a260f7cb5ee77007e3e7225c9" UNIQUE ("code")`);
    await queryRunner.query(`ALTER TABLE "town" ADD "urban_area" double precision NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town" DROP COLUMN "urban_area"`);
    await queryRunner.query(`ALTER TABLE "town" DROP CONSTRAINT "UQ_a4a260f7cb5ee77007e3e7225c9"`);
    await queryRunner.query(`ALTER TABLE "town" DROP COLUMN "code"`);
    await queryRunner.query(`ALTER TABLE "town" ADD "url" text`);
  }
}
