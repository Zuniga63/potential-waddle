import { MigrationInterface, QueryRunner } from 'typeorm';

export class NpmConfigName1727973024069 implements MigrationInterface {
  name = 'NpmConfigName1727973024069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" ADD "popularity" smallint NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "popularity"`);
  }
}
