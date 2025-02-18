import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToSomeModulesTable1739546542804 implements MigrationInterface {
  name = 'AddNewColumnsToSomeModulesTable1739546542804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "commerce" ADD "user_id" uuid`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "restaurant" ADD CONSTRAINT "FK_aefad5ba2f054d4bbc415b3ef2a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce" ADD CONSTRAINT "FK_cc3e0a1b6df6071d99d8607756f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging" ADD CONSTRAINT "FK_5f5d77a51d102146ce5b189db69" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP CONSTRAINT "FK_5f5d77a51d102146ce5b189db69"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP CONSTRAINT "FK_cc3e0a1b6df6071d99d8607756f"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_aefad5ba2f054d4bbc415b3ef2a"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "user_id"`);
  }
}
