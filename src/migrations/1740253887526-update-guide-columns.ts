import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGuideColumns1740253887526 implements MigrationInterface {
  name = 'UpdateGuideColumns1740253887526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" ADD "is_public" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "guide" ALTER COLUMN "phone" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "guide" ALTER COLUMN "whatsapp" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "guide" ALTER COLUMN "address" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" ALTER COLUMN "address" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "guide" ALTER COLUMN "whatsapp" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "guide" ALTER COLUMN "phone" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "is_public"`);
  }
}
