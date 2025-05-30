import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLodgingRoomTypeTable1748578507971 implements MigrationInterface {
  name = 'AddLodgingRoomTypeTable1748578507971';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lodging_room_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "max_capacity" integer NOT NULL, "bed_count" integer NOT NULL DEFAULT '1', "bed_type" text, "room_size" double precision, "smoking_allowed" boolean NOT NULL DEFAULT false, "amenities" text array NOT NULL DEFAULT '{}', "room_count" integer NOT NULL DEFAULT '1', "bathroom_type" text, "has_balcony" boolean NOT NULL DEFAULT false, "has_kitchen" boolean NOT NULL DEFAULT false, "has_air_conditioning" boolean NOT NULL DEFAULT false, "has_wifi" boolean NOT NULL DEFAULT true, "view" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "lodging_id" uuid, CONSTRAINT "PK_579143308e32ae8388e8614b361" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type" ADD CONSTRAINT "FK_99afc1ea13a607febe11de5eaff" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging_room_type" DROP CONSTRAINT "FK_99afc1ea13a607febe11de5eaff"`);
    await queryRunner.query(`DROP TABLE "lodging_room_type"`);
  }
}
