import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuidesToExperienceTable1730427467406 implements MigrationInterface {
  name = 'AddGuidesToExperienceTable1730427467406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" ADD "guides" jsonb DEFAULT '[]'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "guides"`);
  }
}
