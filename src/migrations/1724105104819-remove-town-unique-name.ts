import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTownUniqueName1724105104819 implements MigrationInterface {
  name = 'RemoveTownUniqueName1724105104819';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town" DROP CONSTRAINT "UQ_9511a4e785196486335a4f688e2"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town" ADD CONSTRAINT "UQ_9511a4e785196486335a4f688e2" UNIQUE ("name")`);
  }
}
