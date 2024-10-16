import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixLodgingRating1729088843932 implements MigrationInterface {
  name = 'AddFixLodgingRating1729088843932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "rating"`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "rating" double precision NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "rating"`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "rating" smallint NOT NULL DEFAULT '0'`);
  }
}
