import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLodgingFreePlan1773200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert the Plan Free for lodgings.
    // ON CONFLICT (slug) DO NOTHING makes this idempotent on re-runs.
    await queryRunner.query(`
      INSERT INTO "plans" (
        "id",
        "name",
        "slug",
        "description",
        "price_in_cents",
        "currency",
        "billing_interval",
        "is_active",
        "sort_order",
        "created_at",
        "updated_at"
      ) VALUES (
        uuid_generate_v4(),
        'Plan Free Lodging',
        'lodging-free',
        'Plan gratuito perpetuo para alojamientos',
        0,
        'COP',
        'lifetime',
        true,
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "plans" WHERE "slug" = 'lodging-free'`);
  }
}
