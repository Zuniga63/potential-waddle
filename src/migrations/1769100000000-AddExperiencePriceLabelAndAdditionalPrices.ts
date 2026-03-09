import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExperiencePriceLabelAndAdditionalPrices1769100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "experience" ADD "price_label" text NOT NULL DEFAULT 'Persona'`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience" ADD "additional_prices" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "additional_prices"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "price_label"`);
  }
}
