import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDepartmentUniqueName1724104845493 implements MigrationInterface {
  name = 'RemoveDepartmentUniqueName1724104845493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "UQ_471da4b90e96c1ebe0af221e07b"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "UQ_471da4b90e96c1ebe0af221e07b" UNIQUE ("name")`);
  }
}
