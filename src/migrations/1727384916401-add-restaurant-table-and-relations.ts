import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRestaurantTableAndRelations1727384916401 implements MigrationInterface {
  name = 'AddRestaurantTableAndRelations1727384916401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "restaurant_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL DEFAULT '0', "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "restaurant_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_5040fdcfbdf7ed485c367e79c44" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "restaurant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "rating" double precision NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "spoken_languages" text array, "address" text, "phone_numbers" text array, "whatsapp_numbers" text array NOT NULL DEFAULT '{}', "opening_hours" text array, "email" text, "website" text, "instagram" text, "facebook" text, "lowest_price" numeric(10,2), "higher_price" numeric(10,2), "location" geometry(Point,4326) NOT NULL, "urban_center_distance" integer, "google_maps_url" text, "how_to_get_there" text, "town_zone" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, "place_id" uuid, CONSTRAINT "UQ_cb7f1c337dcb0595ba6d44265f6" UNIQUE ("slug"), CONSTRAINT "PK_649e250d8b8165cb406d99aa30f" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(`CREATE INDEX "IDX_a4e247203bbc0618c88786121c" ON "restaurant" USING GiST ("location") `);

    await queryRunner.query(
      `CREATE TABLE "restaurant_category" ("restaurant_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_1161700152d02c42360f829aaa0" PRIMARY KEY ("restaurant_id", "category_id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_b9f81c9708a9ccd5e3c7b82e32" ON "restaurant_category" ("restaurant_id") `,
    );

    await queryRunner.query(`CREATE INDEX "IDX_355400610db376e89b96456c67" ON "restaurant_category" ("category_id") `);

    await queryRunner.query(
      `CREATE TABLE "restaurant_facility" ("restaurant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_7f18b9a6e87207c9939b5d2e4d7" PRIMARY KEY ("restaurant_id", "facility_id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_4dd7c143b9427190da050bd520" ON "restaurant_facility" ("restaurant_id") `,
    );

    await queryRunner.query(`CREATE INDEX "IDX_69826ba4dd2e6c269d1d9d4f25" ON "restaurant_facility" ("facility_id") `);

    await queryRunner.query(
      `ALTER TABLE "restaurant_image" ADD CONSTRAINT "FK_ec5aaeb9b351d8233e8751015ab" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "restaurant_image" ADD CONSTRAINT "FK_c283f279dcff7582929cde4dec5" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "restaurant" ADD CONSTRAINT "FK_ad6e8ba4b7cac37de67bcf0e005" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "restaurant" ADD CONSTRAINT "FK_2ec0e43b8552a729fa87fa7a4b4" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "restaurant_category" ADD CONSTRAINT "FK_b9f81c9708a9ccd5e3c7b82e32c" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "restaurant_category" ADD CONSTRAINT "FK_355400610db376e89b96456c67a" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "restaurant_facility" ADD CONSTRAINT "FK_4dd7c143b9427190da050bd5204" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "restaurant_facility" ADD CONSTRAINT "FK_69826ba4dd2e6c269d1d9d4f25b" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant_facility" DROP CONSTRAINT "FK_69826ba4dd2e6c269d1d9d4f25b"`);
    await queryRunner.query(`ALTER TABLE "restaurant_facility" DROP CONSTRAINT "FK_4dd7c143b9427190da050bd5204"`);
    await queryRunner.query(`ALTER TABLE "restaurant_category" DROP CONSTRAINT "FK_355400610db376e89b96456c67a"`);
    await queryRunner.query(`ALTER TABLE "restaurant_category" DROP CONSTRAINT "FK_b9f81c9708a9ccd5e3c7b82e32c"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_2ec0e43b8552a729fa87fa7a4b4"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_ad6e8ba4b7cac37de67bcf0e005"`);
    await queryRunner.query(`ALTER TABLE "restaurant_image" DROP CONSTRAINT "FK_c283f279dcff7582929cde4dec5"`);
    await queryRunner.query(`ALTER TABLE "restaurant_image" DROP CONSTRAINT "FK_ec5aaeb9b351d8233e8751015ab"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69826ba4dd2e6c269d1d9d4f25"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4dd7c143b9427190da050bd520"`);
    await queryRunner.query(`DROP TABLE "restaurant_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_355400610db376e89b96456c67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b9f81c9708a9ccd5e3c7b82e32"`);
    await queryRunner.query(`DROP TABLE "restaurant_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4e247203bbc0618c88786121c"`);
    await queryRunner.query(`DROP TABLE "restaurant"`);
    await queryRunner.query(`DROP TABLE "restaurant_image"`);
  }
}
