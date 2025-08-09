import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicEventTables1754753711969 implements MigrationInterface {
  name = 'AddPublicEventTables1754753711969';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" DROP CONSTRAINT "FK_lodging_room_type_image_image_resource"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" DROP CONSTRAINT "FK_lodging_room_type_image_room_type"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_promotion_entity_type_entity_id"`);
    await queryRunner.query(
      `CREATE TABLE "public_event_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "display_order" integer NOT NULL DEFAULT '0', "is_main" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "public_event_id" uuid, "image_resource_id" uuid, CONSTRAINT "REL_3210102dcfee4fbdb2fe347516" UNIQUE ("image_resource_id"), CONSTRAINT "PK_5918abd51efc996b45b3d5cf6a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "public_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_name" text NOT NULL, "slug" text NOT NULL, "description" text NOT NULL, "video" text, "date" date NOT NULL, "time" TIME NOT NULL, "price" numeric(10,2) NOT NULL, "address" text NOT NULL, "location" geometry(Point,4326), "responsible" text NOT NULL, "contact" text NOT NULL, "registration_link" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_325d6e25982164505cf4ef7bc6e" UNIQUE ("slug"), CONSTRAINT "PK_cf1a6efea9b1d005a497017364b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_e3e63f70575bbb7293a5c2cb8e" ON "public_event" USING GiST ("location") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_c5cc21635d1f8c631845274d72" ON "promotion" ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" ADD CONSTRAINT "FK_bb5d11cf0b996fe66c419c4885f" FOREIGN KEY ("room_type_id") REFERENCES "lodging_room_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" ADD CONSTRAINT "FK_9f26d98327ce8960246283b5b93" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public_event_image" ADD CONSTRAINT "FK_e51779043cd6b3be5f1b5662634" FOREIGN KEY ("public_event_id") REFERENCES "public_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public_event_image" ADD CONSTRAINT "FK_3210102dcfee4fbdb2fe347516a" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public_event" ADD CONSTRAINT "FK_c984f67223d4062154b70f19163" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public_event" ADD CONSTRAINT "FK_eba462f3597ca09a0deb4b78c45" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public_event" DROP CONSTRAINT "FK_eba462f3597ca09a0deb4b78c45"`);
    await queryRunner.query(`ALTER TABLE "public_event" DROP CONSTRAINT "FK_c984f67223d4062154b70f19163"`);
    await queryRunner.query(`ALTER TABLE "public_event_image" DROP CONSTRAINT "FK_3210102dcfee4fbdb2fe347516a"`);
    await queryRunner.query(`ALTER TABLE "public_event_image" DROP CONSTRAINT "FK_e51779043cd6b3be5f1b5662634"`);
    await queryRunner.query(`ALTER TABLE "lodging_room_type_image" DROP CONSTRAINT "FK_9f26d98327ce8960246283b5b93"`);
    await queryRunner.query(`ALTER TABLE "lodging_room_type_image" DROP CONSTRAINT "FK_bb5d11cf0b996fe66c419c4885f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c5cc21635d1f8c631845274d72"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e3e63f70575bbb7293a5c2cb8e"`);
    await queryRunner.query(`DROP TABLE "public_event"`);
    await queryRunner.query(`DROP TABLE "public_event_image"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_promotion_entity_type_entity_id" ON "promotion" ("entity_id", "entity_type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" ADD CONSTRAINT "FK_lodging_room_type_image_room_type" FOREIGN KEY ("room_type_id") REFERENCES "lodging_room_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" ADD CONSTRAINT "FK_lodging_room_type_image_image_resource" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
