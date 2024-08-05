import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePlaceRatingToFloat1722865565896 implements MigrationInterface {
  name = 'ChangePlaceRatingToFloat1722865565896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "rating"`);
    await queryRunner.query(`ALTER TABLE "place" ADD "rating" double precision NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "rating"`);
    await queryRunner.query(`ALTER TABLE "place" ADD "rating" smallint NOT NULL DEFAULT '0'`);
  }
}
