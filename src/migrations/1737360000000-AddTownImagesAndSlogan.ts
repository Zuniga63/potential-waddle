import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTownImagesAndSlogan1737360000000 implements MigrationInterface {
  name = 'AddTownImagesAndSlogan1737360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add slogan column to town table
    await queryRunner.query(`
      ALTER TABLE "town" ADD COLUMN "slogan" text
    `);

    // 2. Create town_image table
    await queryRunner.query(`
      CREATE TABLE "town_image" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "town_id" uuid NOT NULL,
        "image_resource_id" uuid NOT NULL,
        "order" smallint NOT NULL DEFAULT 0,
        "is_hero" boolean NOT NULL DEFAULT false,
        "hero_position" smallint,
        "is_public" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_town_image" PRIMARY KEY ("id")
      )
    `);

    // 3. Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_town_image_town_id" ON "town_image" ("town_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_town_image_is_hero" ON "town_image" ("is_hero")`);
    await queryRunner.query(`CREATE INDEX "IDX_town_image_hero_position" ON "town_image" ("hero_position")`);

    // 4. Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "town_image"
      ADD CONSTRAINT "FK_town_image_town"
      FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "town_image"
      ADD CONSTRAINT "FK_town_image_image_resource"
      FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "town_image" DROP CONSTRAINT "FK_town_image_image_resource"`);
    await queryRunner.query(`ALTER TABLE "town_image" DROP CONSTRAINT "FK_town_image_town"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_town_image_hero_position"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_town_image_is_hero"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_town_image_town_id"`);

    // Drop town_image table
    await queryRunner.query(`DROP TABLE "town_image"`);

    // Remove slogan column from town table
    await queryRunner.query(`ALTER TABLE "town" DROP COLUMN "slogan"`);
  }
}
