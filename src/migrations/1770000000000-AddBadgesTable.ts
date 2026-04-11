import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBadgesTable1770000000000 implements MigrationInterface {
  name = 'AddBadgesTable1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "badge" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "icon" text,
        "icon_color" text,
        "background_color" text,
        "image_url" text,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_badge_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_badge_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "entity_badge" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entity_id" uuid NOT NULL,
        "entity_type" text NOT NULL,
        "badge_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_entity_badge_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_entity_badge_entity" ON "entity_badge" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_entity_badge_badge" ON "entity_badge" ("badge_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_entity_badge" ON "entity_badge" ("entity_type", "entity_id", "badge_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "entity_badge"
      ADD CONSTRAINT "FK_entity_badge_badge" FOREIGN KEY ("badge_id") REFERENCES "badge"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "entity_badge"`);
    await queryRunner.query(`DROP TABLE "badge"`);
  }
}
