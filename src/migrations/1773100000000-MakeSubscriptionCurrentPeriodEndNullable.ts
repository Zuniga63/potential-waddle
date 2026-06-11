import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeSubscriptionCurrentPeriodEndNullable1773100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Allow NULL so that Plan Free (lifetime / perpetual) subscriptions can persist without an end date.
    // Existing rows are unaffected — they all have non-null values already.
    await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "current_period_end" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore NOT NULL constraint.
    // Note: if any rows were inserted with NULL current_period_end, this will fail.
    // Clean up those rows before reverting.
    await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "current_period_end" SET NOT NULL`);
  }
}
