import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePlaceTable1721945278156 implements MigrationInterface {
  name = 'UpdatePlaceTable1721945278156';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "place_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "place_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_321b2db7828123af67c2afc42f0" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "stateDB"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "name_en"`);
    await queryRunner.query(`ALTER TABLE "place" DROP CONSTRAINT "UQ_54d002d2bfed3c76958146cc0bb"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "slug_en"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "description_en"`);
    await queryRunner.query(`ALTER TABLE "place" ADD "location" geometry(Point,4326) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "place" ADD "urbar_center_distance" smallint NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "place" ADD "google_maps_url" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "history" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "temperature" smallint`);
    await queryRunner.query(`ALTER TABLE "place" ADD "max_depth" smallint`);
    await queryRunner.query(`ALTER TABLE "place" ADD "altitude" smallint`);
    await queryRunner.query(`ALTER TABLE "place" ADD "capacity" smallint`);
    await queryRunner.query(`ALTER TABLE "place" ADD "min_age" smallint`);
    await queryRunner.query(`ALTER TABLE "place" ADD "max_age" smallint`);
    await queryRunner.query(`ALTER TABLE "place" ADD "how_to_get_there" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "transport_reference" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "local_transport_options" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "arrival_reference" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "recommendations" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "how_to_dress" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "restrictions" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "observations" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "state_db" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`CREATE INDEX "IDX_497f3216ef683acf6954bd6fb2" ON "place" USING GiST ("location") `);
    await queryRunner.query(
      `ALTER TABLE "place_image" ADD CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_image" ADD CONSTRAINT "FK_dfbc68191e4bd510f023d8bbe77" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
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
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_dfbc68191e4bd510f023d8bbe77"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_497f3216ef683acf6954bd6fb2"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "state_db"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "observations"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "restrictions"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "how_to_dress"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "recommendations"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "arrival_reference"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "local_transport_options"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "transport_reference"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "how_to_get_there"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "max_age"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "min_age"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "capacity"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "altitude"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "max_depth"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "temperature"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "history"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "google_maps_url"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "urbar_center_distance"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "place" ADD "description_en" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "slug_en" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD CONSTRAINT "UQ_54d002d2bfed3c76958146cc0bb" UNIQUE ("slug_en")`);
    await queryRunner.query(`ALTER TABLE "place" ADD "name_en" text`);
    await queryRunner.query(`ALTER TABLE "place" ADD "stateDB" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`DROP INDEX "public"."IDX_632e9bf4461567d50d91607733"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77d9549751bab0cdec48e15631"`);
    await queryRunner.query(`DROP TABLE "place_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2d94b90b1b87b16c52e18d980"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be5377f9c9e1b717f783376ac4"`);
    await queryRunner.query(`DROP TABLE "place_facility"`);
    await queryRunner.query(`DROP TABLE "place_image"`);
  }
}
