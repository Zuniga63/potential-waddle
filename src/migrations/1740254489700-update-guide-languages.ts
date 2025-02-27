import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGuideLanguages1740254489700 implements MigrationInterface {
  name = 'UpdateGuideLanguages1740254489700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "languages"`);
    await queryRunner.query(`ALTER TABLE "guide" ADD "languages" text array DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "languages"`);
    await queryRunner.query(`ALTER TABLE "guide" ADD "languages" text`);
  }
}
