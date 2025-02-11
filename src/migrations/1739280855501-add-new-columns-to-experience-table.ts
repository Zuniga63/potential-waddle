import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToExperienceTable1739280855501 implements MigrationInterface {
  name = 'AddNewColumnsToExperienceTable1739280855501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" ADD "guide_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "experience" ADD CONSTRAINT "FK_fbc56d64af2791999e84a3b9296" FOREIGN KEY ("guide_id") REFERENCES "guide"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" DROP CONSTRAINT "FK_fbc56d64af2791999e84a3b9296"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "guide_id"`);
  }
}
