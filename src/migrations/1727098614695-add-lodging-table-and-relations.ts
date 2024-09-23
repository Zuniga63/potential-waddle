import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLodgingTableAndRelations1727098614695 implements MigrationInterface {
  name = 'AddLodgingTableAndRelations1727098614695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lodging_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "lodging_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_6b81eb63e980fbc9ad23752a82e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lodging_facility" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "operationHours" text, "locationDescription" text, "accesibliity" text, "additionalInfo" text, "lodging_id" uuid, "facility_id" uuid, CONSTRAINT "PK_bd5c23ceeb3cce496775171d563" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lodging" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "points" smallint NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "rating" smallint NOT NULL DEFAULT '0', "room_types" text array NOT NULL DEFAULT '{}', "room_count" smallint NOT NULL DEFAULT '0', "lowest_price" numeric(10,2), "highest_price" numeric(10,2), "address" text, "phones" text array DEFAULT '{}', "email" text, "website" text, "facebook" text, "instagram" text, "whatsapp_numbers" text array DEFAULT '{}', "opening_hours" text, "language_spoken" text array DEFAULT '{}', "location" geometry(Point,4326) NOT NULL, "google_maps_url" text, "urban_center_distance" smallint, "how_to_get_there" text, "arrival_reference" text, "is_public" boolean NOT NULL DEFAULT true, "state_db" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "UQ_bf76d81e7fbbc30ab876e960351" UNIQUE ("slug"), CONSTRAINT "PK_0d532e3ff6fc6f87e708d0e6216" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_efb0417aefc5c66891199db7f3" ON "lodging" USING GiST ("location") `);
    await queryRunner.query(
      `CREATE TABLE "lodging_category" ("lodging_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_4971617e45af1026e513fa99d99" PRIMARY KEY ("lodging_id", "category_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_34494b0c05038b0c742335088d" ON "lodging_category" ("lodging_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_3fa44dad27d1296f97aa8941b5" ON "lodging_category" ("category_id") `);
    await queryRunner.query(`ALTER TABLE "review" ADD "lodging_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "lodging_image" ADD CONSTRAINT "FK_435b0aa817939e3800ea9ff8d80" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_image" ADD CONSTRAINT "FK_62d941ea7ac0742aa39c901e136" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_facility" ADD CONSTRAINT "FK_3ed3be42aee4509b130c13b446a" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_facility" ADD CONSTRAINT "FK_7b119897e460bbc3039e60dfc3c" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging" ADD CONSTRAINT "FK_54c241de2f9b8f539de88a6e972" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_1f351c0d726c6093d80e7fc5555" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_category" ADD CONSTRAINT "FK_34494b0c05038b0c742335088dd" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_category" ADD CONSTRAINT "FK_3fa44dad27d1296f97aa8941b50" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging_category" DROP CONSTRAINT "FK_3fa44dad27d1296f97aa8941b50"`);
    await queryRunner.query(`ALTER TABLE "lodging_category" DROP CONSTRAINT "FK_34494b0c05038b0c742335088dd"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_1f351c0d726c6093d80e7fc5555"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP CONSTRAINT "FK_54c241de2f9b8f539de88a6e972"`);
    await queryRunner.query(`ALTER TABLE "lodging_facility" DROP CONSTRAINT "FK_7b119897e460bbc3039e60dfc3c"`);
    await queryRunner.query(`ALTER TABLE "lodging_facility" DROP CONSTRAINT "FK_3ed3be42aee4509b130c13b446a"`);
    await queryRunner.query(`ALTER TABLE "lodging_image" DROP CONSTRAINT "FK_62d941ea7ac0742aa39c901e136"`);
    await queryRunner.query(`ALTER TABLE "lodging_image" DROP CONSTRAINT "FK_435b0aa817939e3800ea9ff8d80"`);
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "lodging_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3fa44dad27d1296f97aa8941b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_34494b0c05038b0c742335088d"`);
    await queryRunner.query(`DROP TABLE "lodging_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_efb0417aefc5c66891199db7f3"`);
    await queryRunner.query(`DROP TABLE "lodging"`);
    await queryRunner.query(`DROP TABLE "lodging_facility"`);
    await queryRunner.query(`DROP TABLE "lodging_image"`);
  }
}
