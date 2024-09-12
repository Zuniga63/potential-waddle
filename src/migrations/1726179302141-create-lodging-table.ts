import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLodgingTable1726179302141 implements MigrationInterface {
  name = 'CreateLodgingTable1726179302141';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lodging" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "review_count" integer NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "room_count" smallint NOT NULL DEFAULT '0', "rating" smallint NOT NULL DEFAULT '0', "lowest_price" numeric(10,2), "highest_price" numeric(10,2), "address" text, "phone" text, "email" text, "website" text, "opening_hours" text, "language_spoken" text, "location" geometry(Point,4326) NOT NULL, "google_maps_url" text, "how_to_get_there" text, "arrival_reference" text, "is_public" boolean NOT NULL DEFAULT true, "state_db" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bf76d81e7fbbc30ab876e960351" UNIQUE ("slug"), CONSTRAINT "PK_0d532e3ff6fc6f87e708d0e6216" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_efb0417aefc5c66891199db7f3" ON "lodging" USING GiST ("location") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_efb0417aefc5c66891199db7f3"`);
    await queryRunner.query(`DROP TABLE "lodging"`);
  }
}
