import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelForPlaces1721607954623 implements MigrationInterface {
  name = 'AddModelForPlaces1721607954623';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "place_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "min_age" smallint, "max_age" smallint, "capacity" smallint, "max_depth" smallint, "total_distance" integer NOT NULL, "history" text, "how_to_get_there" text, "ref_to_get_there" text, "how_to_get_around" text, "recomendations" text, "how_to_dress" text, "restrictions" text, "observations" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "history_en" text, "how_to_get_there_en" text, "ref_to_get_there_en" text, "how_to_get_around_en" text, "recomendations_en" text, "how_to_dress_en" text, "restrictions_en" text, "observations_en" text, "place_id" uuid, CONSTRAINT "REL_e536be11005d454c1df8540dbd" UNIQUE ("place_id"), CONSTRAINT "PK_ca975751bc67d114099119af49f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "place_location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "latitude" numeric(9,6) NOT NULL, "longitude" numeric(9,6) NOT NULL, "temperature" smallint, "reference" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "place_id" uuid, CONSTRAINT "REL_6d7dce1290cce202094db1f742" UNIQUE ("place_id"), CONSTRAINT "PK_6c12b94abc7151e1b8cf73e46b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "place_review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "comment" text, "images" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "place_id" uuid, "user_id" uuid, CONSTRAINT "PK_abc740c458780c42a9eb1d5660a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "place_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "image" jsonb NOT NULL, "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "place_id" uuid, CONSTRAINT "PK_321b2db7828123af67c2afc42f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "place" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "image" jsonb NOT NULL, "slug" text NOT NULL, "description" text NOT NULL, "difficulty_level" smallint NOT NULL DEFAULT '1', "rating" smallint NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "stateDB" boolean NOT NULL DEFAULT true, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name_en" text, "slug_en" text, "description_en" text, CONSTRAINT "UQ_1443badb6c7af8994264958b4d3" UNIQUE ("slug"), CONSTRAINT "UQ_54d002d2bfed3c76958146cc0bb" UNIQUE ("slug_en"), CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "place_facility" ("placeId" uuid NOT NULL, "facilityId" uuid NOT NULL, CONSTRAINT "PK_05de4d0c65f341a319eca5dc18f" PRIMARY KEY ("placeId", "facilityId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_be5377f9c9e1b717f783376ac4" ON "place_facility" ("placeId") `);
    await queryRunner.query(`CREATE INDEX "IDX_d2d94b90b1b87b16c52e18d980" ON "place_facility" ("facilityId") `);
    await queryRunner.query(
      `CREATE TABLE "place_category" ("placeId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_43cd1d7bee9a02f09d9fd3cf592" PRIMARY KEY ("placeId", "categoryId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_77d9549751bab0cdec48e15631" ON "place_category" ("placeId") `);
    await queryRunner.query(`CREATE INDEX "IDX_632e9bf4461567d50d91607733" ON "place_category" ("categoryId") `);
    await queryRunner.query(
      `ALTER TABLE "place_info" ADD CONSTRAINT "FK_e536be11005d454c1df8540dbdf" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_location" ADD CONSTRAINT "FK_6d7dce1290cce202094db1f742b" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_review" ADD CONSTRAINT "FK_449e082907f0c59f9e33773239f" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_review" ADD CONSTRAINT "FK_17179acad8f27672f8ca5c81fad" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_image" ADD CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_facility" ADD CONSTRAINT "FK_be5377f9c9e1b717f783376ac49" FOREIGN KEY ("placeId") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_facility" ADD CONSTRAINT "FK_d2d94b90b1b87b16c52e18d980a" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_category" ADD CONSTRAINT "FK_77d9549751bab0cdec48e15631a" FOREIGN KEY ("placeId") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_category" ADD CONSTRAINT "FK_632e9bf4461567d50d91607733d" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_632e9bf4461567d50d91607733d"`);
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_77d9549751bab0cdec48e15631a"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_d2d94b90b1b87b16c52e18d980a"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_be5377f9c9e1b717f783376ac49"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898"`);
    await queryRunner.query(`ALTER TABLE "place_review" DROP CONSTRAINT "FK_17179acad8f27672f8ca5c81fad"`);
    await queryRunner.query(`ALTER TABLE "place_review" DROP CONSTRAINT "FK_449e082907f0c59f9e33773239f"`);
    await queryRunner.query(`ALTER TABLE "place_location" DROP CONSTRAINT "FK_6d7dce1290cce202094db1f742b"`);
    await queryRunner.query(`ALTER TABLE "place_info" DROP CONSTRAINT "FK_e536be11005d454c1df8540dbdf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_632e9bf4461567d50d91607733"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77d9549751bab0cdec48e15631"`);
    await queryRunner.query(`DROP TABLE "place_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2d94b90b1b87b16c52e18d980"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be5377f9c9e1b717f783376ac4"`);
    await queryRunner.query(`DROP TABLE "place_facility"`);
    await queryRunner.query(`DROP TABLE "place"`);
    await queryRunner.query(`DROP TABLE "place_image"`);
    await queryRunner.query(`DROP TABLE "place_review"`);
    await queryRunner.query(`DROP TABLE "place_location"`);
    await queryRunner.query(`DROP TABLE "place_info"`);
  }
}
