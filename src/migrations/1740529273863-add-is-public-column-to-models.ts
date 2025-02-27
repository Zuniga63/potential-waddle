import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsPublicColumnToModels1740529273863 implements MigrationInterface {
  name = 'AddIsPublicColumnToModels1740529273863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transport" ADD "is_public" boolean DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "is_public" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "experience" ADD "is_public" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "is_public"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "is_public"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "is_public"`);
  }
}
