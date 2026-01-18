import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionsModule1768500000000 implements MigrationInterface {
  name = 'AddSubscriptionsModule1768500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create ENUM types
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_status_enum" AS ENUM('pending', 'active', 'canceled', 'past_due', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_entity_type_enum" AS ENUM('lodging', 'restaurant', 'commerce', 'transport', 'guide')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'approved', 'declined', 'voided', 'error')`,
    );

    // 2. Create plans table
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(50) NOT NULL,
        "slug" character varying(50) NOT NULL,
        "description" text,
        "price_in_cents" integer NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'COP',
        "billing_interval" character varying(20) NOT NULL DEFAULT 'monthly',
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plans_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_plans" PRIMARY KEY ("id")
      )
    `);

    // 3. Create plan_features table
    await queryRunner.query(`
      CREATE TABLE "plan_features" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "feature_key" character varying(100) NOT NULL,
        "feature_name" character varying(255) NOT NULL,
        "feature_value" jsonb,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_plan_features" PRIMARY KEY ("id")
      )
    `);

    // 4. Create payments table (1 Payment -> N Subscriptions)
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "reference" character varying(100) NOT NULL,
        "amount_in_cents" integer NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'COP',
        "status" "public"."payment_status_enum" NOT NULL DEFAULT 'pending',
        "wompi_transaction_id" character varying(100),
        "payment_method" character varying(50),
        "wompi_response" jsonb,
        "failure_reason" text,
        "paid_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_payments_reference" UNIQUE ("reference"),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // 5. Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "payment_id" uuid,
        "status" "public"."subscription_status_enum" NOT NULL DEFAULT 'pending',
        "entity_type" "public"."subscription_entity_type_enum" NOT NULL,
        "entity_id" uuid NOT NULL,
        "entity_name" character varying(255),
        "current_period_start" TIMESTAMP NOT NULL,
        "current_period_end" TIMESTAMP NOT NULL,
        "canceled_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);

    // 6. Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_payments_user_id" ON "payments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_reference" ON "payments" ("reference")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_wompi_transaction_id" ON "payments" ("wompi_transaction_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_payment_id" ON "subscriptions" ("payment_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_entity" ON "subscriptions" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`);

    // 7. Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "plan_features"
      ADD CONSTRAINT "FK_plan_features_plan"
      FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscriptions_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscriptions_plan"
      FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscriptions_payment"
      FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 8. Insert initial plans
    await queryRunner.query(`
      INSERT INTO "plans" ("name", "slug", "description", "price_in_cents", "sort_order") VALUES
      ('Básico', 'basico', 'Todo lo que necesitas para empezar a crecer en Binntu.', 6990000, 1),
      ('Pro', 'pro', 'Para negocios que quieren destacar y crecer más rápido.', 9990000, 2)
    `);

    // 9. Insert plan features for Básico
    await queryRunner.query(`
      INSERT INTO "plan_features" ("plan_id", "feature_key", "feature_name", "feature_value", "is_enabled", "sort_order")
      SELECT id, 'max_photos', 'Galería de fotos', '{"limit": 10}'::jsonb, true, 1 FROM "plans" WHERE slug = 'basico'
      UNION ALL
      SELECT id, 'google_reviews', 'Reseñas de Google', '{"enabled": false}'::jsonb, false, 2 FROM "plans" WHERE slug = 'basico'
      UNION ALL
      SELECT id, 'ai_analysis', 'Análisis con IA', '{"enabled": false}'::jsonb, false, 3 FROM "plans" WHERE slug = 'basico'
      UNION ALL
      SELECT id, 'promotions', 'Promociones', '{"enabled": false}'::jsonb, false, 4 FROM "plans" WHERE slug = 'basico'
      UNION ALL
      SELECT id, 'priority_support', 'Soporte prioritario', '{"enabled": false}'::jsonb, false, 5 FROM "plans" WHERE slug = 'basico'
    `);

    // 10. Insert plan features for Pro
    await queryRunner.query(`
      INSERT INTO "plan_features" ("plan_id", "feature_key", "feature_name", "feature_value", "is_enabled", "sort_order")
      SELECT id, 'max_photos', 'Galería de fotos ilimitada', '{"limit": -1}'::jsonb, true, 1 FROM "plans" WHERE slug = 'pro'
      UNION ALL
      SELECT id, 'google_reviews', 'Reseñas de Google', '{"enabled": true}'::jsonb, true, 2 FROM "plans" WHERE slug = 'pro'
      UNION ALL
      SELECT id, 'ai_analysis', 'Análisis con IA', '{"enabled": true}'::jsonb, true, 3 FROM "plans" WHERE slug = 'pro'
      UNION ALL
      SELECT id, 'promotions', 'Promociones', '{"enabled": true}'::jsonb, true, 4 FROM "plans" WHERE slug = 'pro'
      UNION ALL
      SELECT id, 'priority_support', 'Soporte prioritario', '{"enabled": true}'::jsonb, true, 5 FROM "plans" WHERE slug = 'pro'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_payment"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_plan"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_user"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_user"`);
    await queryRunner.query(`ALTER TABLE "plan_features" DROP CONSTRAINT "FK_plan_features_plan"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_entity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_payment_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_wompi_transaction_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_reference"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_user_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "plan_features"`);
    await queryRunner.query(`DROP TABLE "plans"`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscription_entity_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscription_status_enum"`);
  }
}
