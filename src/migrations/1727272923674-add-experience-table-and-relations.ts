import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExperienceTableAndRelations1727272923674 implements MigrationInterface {
  name = 'AddExperienceTableAndRelations1727272923674';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "experience_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL DEFAULT '0', "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "experience_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_b5ba44c4f6738fbe2bede03f76c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "experience" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "slug" text NOT NULL, "description" text NOT NULL, "difficulty_level" smallint NOT NULL DEFAULT '1', "price" numeric(10,2) NOT NULL, "departure_description" text, "departure_location" geometry(Point,4326) NOT NULL, "arrival_description" text, "arrival_location" geometry(Point,4326) NOT NULL, "travel_time" integer, "total_distance" integer, "rating" double precision NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "reviews_count" integer NOT NULL DEFAULT '0', "min_age" smallint, "max_age" smallint, "min_participants" smallint, "max_participants" smallint, "recommendations" text, "how_to_dress" text, "restrictions" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "UQ_46ee360a356c8dbd9a10176117f" UNIQUE ("slug"), CONSTRAINT "PK_5e8d5a534100e1b17ee2efa429a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b800b3c7fb310c5e709d0db33c" ON "experience" USING GiST ("departure_location") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca6bceb620a621ee97b4fdfaa1" ON "experience" USING GiST ("arrival_location") `,
    );
    await queryRunner.query(
      `CREATE TABLE "experience_facility" ("experienceId" uuid NOT NULL, "facilityId" uuid NOT NULL, CONSTRAINT "PK_7af561dc97daae600c210d6413f" PRIMARY KEY ("experienceId", "facilityId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_101f71a8fa1e7762342c853541" ON "experience_facility" ("experienceId") `);
    await queryRunner.query(`CREATE INDEX "IDX_ad659199af907fbb92ade67dbc" ON "experience_facility" ("facilityId") `);
    await queryRunner.query(
      `CREATE TABLE "experience_category" ("experienceId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_d0e1941385abb89af102b335a2d" PRIMARY KEY ("experienceId", "categoryId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_9959ce82e3b7f34221b8281a95" ON "experience_category" ("experienceId") `);
    await queryRunner.query(`CREATE INDEX "IDX_20197e04b7cc6854b1adbd30ef" ON "experience_category" ("categoryId") `);
    await queryRunner.query(`ALTER TABLE "review" ADD "experience_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "experience_image" ADD CONSTRAINT "FK_2c589c23974b417d50c2766a2ee" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_image" ADD CONSTRAINT "FK_74e7172a85d15d15d3a148f97a4" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience" ADD CONSTRAINT "FK_6189389856e1d6ceec45613a494" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_cd173603c99ea9a81a0c18c5098" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_facility" ADD CONSTRAINT "FK_101f71a8fa1e7762342c8535414" FOREIGN KEY ("experienceId") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_facility" ADD CONSTRAINT "FK_ad659199af907fbb92ade67dbc2" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_category" ADD CONSTRAINT "FK_9959ce82e3b7f34221b8281a959" FOREIGN KEY ("experienceId") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_category" ADD CONSTRAINT "FK_20197e04b7cc6854b1adbd30eff" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience_category" DROP CONSTRAINT "FK_20197e04b7cc6854b1adbd30eff"`);
    await queryRunner.query(`ALTER TABLE "experience_category" DROP CONSTRAINT "FK_9959ce82e3b7f34221b8281a959"`);
    await queryRunner.query(`ALTER TABLE "experience_facility" DROP CONSTRAINT "FK_ad659199af907fbb92ade67dbc2"`);
    await queryRunner.query(`ALTER TABLE "experience_facility" DROP CONSTRAINT "FK_101f71a8fa1e7762342c8535414"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_cd173603c99ea9a81a0c18c5098"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP CONSTRAINT "FK_6189389856e1d6ceec45613a494"`);
    await queryRunner.query(`ALTER TABLE "experience_image" DROP CONSTRAINT "FK_74e7172a85d15d15d3a148f97a4"`);
    await queryRunner.query(`ALTER TABLE "experience_image" DROP CONSTRAINT "FK_2c589c23974b417d50c2766a2ee"`);
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "experience_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20197e04b7cc6854b1adbd30ef"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9959ce82e3b7f34221b8281a95"`);
    await queryRunner.query(`DROP TABLE "experience_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ad659199af907fbb92ade67dbc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_101f71a8fa1e7762342c853541"`);
    await queryRunner.query(`DROP TABLE "experience_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ca6bceb620a621ee97b4fdfaa1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b800b3c7fb310c5e709d0db33c"`);
    await queryRunner.query(`DROP TABLE "experience"`);
    await queryRunner.query(`DROP TABLE "experience_image"`);
  }
}
