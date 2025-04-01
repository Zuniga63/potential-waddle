import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuideTypeToTable1743527691132 implements MigrationInterface {
  name = 'AddGuideTypeToTable1743527691132';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" ADD "guide_type" text array DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "guide_type"`);
  }
}
