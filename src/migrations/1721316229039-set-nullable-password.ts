import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetNullablePassword1721316229039 implements MigrationInterface {
  name = 'SetNullablePassword1721316229039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
  }
}
