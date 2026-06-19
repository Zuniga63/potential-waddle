import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRestaurantPriceRanges1774600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" ADD COLUMN IF NOT EXISTS "price_ranges" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN IF EXISTS "price_ranges"`);
  }
}
