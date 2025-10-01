import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWhatsappClicksTable1759325263652 implements MigrationInterface {
    name = 'CreateWhatsappClicksTable1759325263652'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "whatsapp_click" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_id" text NOT NULL, "entity_type" text NOT NULL, "entity_slug" text, "phone_number" text NOT NULL, "session_id" text, "ip_address" text, "user_agent" text, "browser_name" text, "browser_version" text, "os_name" text, "os_version" text, "device_type" text, "latitude" numeric(10,8), "longitude" numeric(11,8), "country" text, "city" text, "referrer" text, "time_on_page" integer, "is_repeat_click" boolean NOT NULL DEFAULT false, "clicked_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_aaf3f203a860c06a5ed672eb119" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d79e2ac9520d094141272ab11d" ON "whatsapp_click" ("clicked_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_6428ae4ed0598983eb63bfada8" ON "whatsapp_click" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_df7abf03d2adb42442a9ecac06" ON "whatsapp_click" ("entity_type", "entity_id") `);
        await queryRunner.query(`ALTER TABLE "public_event" ALTER COLUMN "price" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "whatsapp_click" ADD CONSTRAINT "FK_5a4249b6a5cfbed9d9b52ecc43b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_click" DROP CONSTRAINT "FK_5a4249b6a5cfbed9d9b52ecc43b"`);
        await queryRunner.query(`ALTER TABLE "public_event" ALTER COLUMN "price" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df7abf03d2adb42442a9ecac06"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6428ae4ed0598983eb63bfada8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d79e2ac9520d094141272ab11d"`);
        await queryRunner.query(`DROP TABLE "whatsapp_click"`);
    }

}
