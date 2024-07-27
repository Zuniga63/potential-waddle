import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveImagePlace1722011138694 implements MigrationInterface {
  name = 'RemoveImagePlace1722011138694';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "image"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" ADD "image" jsonb NOT NULL`);
  }
}
