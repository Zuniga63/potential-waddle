import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugToModel1724104519197 implements MigrationInterface {
  name = 'AddSlugToModel1724104519197';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" ADD "slug" text`);
    await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "UQ_7debb3b99f60ffb46b981351623" UNIQUE ("slug")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "UQ_7debb3b99f60ffb46b981351623"`);
    await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "slug"`);
  }
}
