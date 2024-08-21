import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeSlugToCodeInAppIcon1724266628118 implements MigrationInterface {
  name = 'ChangeSlugToCodeInAppIcon1724266628118';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_icon" RENAME COLUMN "slug" TO "code"`);
    await queryRunner.query(
      `ALTER TABLE "app_icon" RENAME CONSTRAINT "UQ_b4512505727a2bf0994a410556c" TO "UQ_ba1a2b9896a1c214372f9d76a7d"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_icon" RENAME CONSTRAINT "UQ_ba1a2b9896a1c214372f9d76a7d" TO "UQ_b4512505727a2bf0994a410556c"`,
    );
    await queryRunner.query(`ALTER TABLE "app_icon" RENAME COLUMN "code" TO "slug"`);
  }
}
