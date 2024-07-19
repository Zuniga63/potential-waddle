import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeNameToUsername1721223996009 implements MigrationInterface {
  name = 'ChangeNameToUsername1721223996009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "name" TO "username"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "username" TO "name"`);
  }
}
