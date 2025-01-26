import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommerceTable1737900958968 implements MigrationInterface {
  name = 'AddCommerceTable1737900958968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "commerce_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "commerce_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_eae61974f21a6822fadbb4ed97d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "commerce" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "points" smallint NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "rating" double precision NOT NULL DEFAULT '0', "address" text, "phone_numbers" text array DEFAULT '{}', "email" text, "website" text, "facebook" text, "instagram" text, "whatsapp_numbers" text array DEFAULT '{}', "opening_hours" text array, "spoken_languages" text array DEFAULT '{}', "payment_methods" text array DEFAULT '{}', "services" text array DEFAULT '{}', "location" geometry(Point,4326) NOT NULL, "google_maps_url" text, "urban_center_distance" smallint, "how_to_get_there" text, "arrival_reference" text, "is_public" boolean NOT NULL DEFAULT true, "state_db" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "UQ_0994a8770a46147b268d9ed338b" UNIQUE ("slug"), CONSTRAINT "PK_18731343cc862b903699fb5c02e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_92721c90475349a9aeedbbf158" ON "commerce" USING GiST ("location") `);
    await queryRunner.query(
      `CREATE TABLE "commerce_category" ("commerce_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_da3e1a74870794e9acc760e0d01" PRIMARY KEY ("commerce_id", "category_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_cbd0eaafaf264fe324c44fd2af" ON "commerce_category" ("commerce_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_5c5cffc0393d09d3fac549dc86" ON "commerce_category" ("category_id") `);
    await queryRunner.query(
      `CREATE TABLE "commerce_facility" ("commerce_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_5b94ee794736b15c00e89f77e3f" PRIMARY KEY ("commerce_id", "facility_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_c439a5d769c7417c6e066f10a1" ON "commerce_facility" ("commerce_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_5e3a4ce55fc50fb8ee4bea1b0c" ON "commerce_facility" ("facility_id") `);
    await queryRunner.query(`ALTER TABLE "review" ADD "commerce_id" uuid`);
    await queryRunner.query(`ALTER TABLE "transport" DROP CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901"`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "whatsapp" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "start_time" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "end_time" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "user_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "commerce_image" ADD CONSTRAINT "FK_df5f48ad899e3df3a414996ee1c" FOREIGN KEY ("commerce_id") REFERENCES "commerce"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_image" ADD CONSTRAINT "FK_e9a2847d00d5c6e3b1acf487070" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce" ADD CONSTRAINT "FK_cf41d2710d2c643549c953b486d" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport" ADD CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_a87b85026c106a4eba20d0dcc01" FOREIGN KEY ("commerce_id") REFERENCES "commerce"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_category" ADD CONSTRAINT "FK_cbd0eaafaf264fe324c44fd2afa" FOREIGN KEY ("commerce_id") REFERENCES "commerce"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_category" ADD CONSTRAINT "FK_5c5cffc0393d09d3fac549dc864" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_facility" ADD CONSTRAINT "FK_c439a5d769c7417c6e066f10a1b" FOREIGN KEY ("commerce_id") REFERENCES "commerce"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_facility" ADD CONSTRAINT "FK_5e3a4ce55fc50fb8ee4bea1b0cc" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "commerce_facility" DROP CONSTRAINT "FK_5e3a4ce55fc50fb8ee4bea1b0cc"`);
    await queryRunner.query(`ALTER TABLE "commerce_facility" DROP CONSTRAINT "FK_c439a5d769c7417c6e066f10a1b"`);
    await queryRunner.query(`ALTER TABLE "commerce_category" DROP CONSTRAINT "FK_5c5cffc0393d09d3fac549dc864"`);
    await queryRunner.query(`ALTER TABLE "commerce_category" DROP CONSTRAINT "FK_cbd0eaafaf264fe324c44fd2afa"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_a87b85026c106a4eba20d0dcc01"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP CONSTRAINT "FK_cf41d2710d2c643549c953b486d"`);
    await queryRunner.query(`ALTER TABLE "commerce_image" DROP CONSTRAINT "FK_e9a2847d00d5c6e3b1acf487070"`);
    await queryRunner.query(`ALTER TABLE "commerce_image" DROP CONSTRAINT "FK_df5f48ad899e3df3a414996ee1c"`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "user_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "end_time" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "start_time" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transport" ALTER COLUMN "whatsapp" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transport" ADD CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "commerce_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5e3a4ce55fc50fb8ee4bea1b0c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c439a5d769c7417c6e066f10a1"`);
    await queryRunner.query(`DROP TABLE "commerce_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5c5cffc0393d09d3fac549dc86"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cbd0eaafaf264fe324c44fd2af"`);
    await queryRunner.query(`DROP TABLE "commerce_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_92721c90475349a9aeedbbf158"`);
    await queryRunner.query(`DROP TABLE "commerce"`);
    await queryRunner.query(`DROP TABLE "commerce_image"`);
  }
}
