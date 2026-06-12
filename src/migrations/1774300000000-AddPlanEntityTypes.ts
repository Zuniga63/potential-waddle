import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanEntityTypes1774300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add entity_types[] column on plans so admin can select which business types
    // each plan applies to. Empty array (default) is treated by the frontend as
    // "applies to all" for backwards compatibility with plans created before this column.
    await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN "entity_types" text[] NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "entity_types"`);
  }
}
