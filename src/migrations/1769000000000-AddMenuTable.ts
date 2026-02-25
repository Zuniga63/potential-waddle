import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMenuTable1769000000000 implements MigrationInterface {
    name = 'AddMenuTable1769000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "menu" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "restaurant_id" uuid NOT NULL,
                "data" jsonb,
                "file_url" text,
                "file_name" text,
                "mime_type" text,
                "status" text NOT NULL DEFAULT 'processing',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_menu_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "menu"
            ADD CONSTRAINT "FK_menu_restaurant"
            FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu" DROP CONSTRAINT "FK_menu_restaurant"`);
        await queryRunner.query(`DROP TABLE "menu"`);
    }
}
