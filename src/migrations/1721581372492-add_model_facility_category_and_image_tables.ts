import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelFacilityCategoryAndImageTables1721581372492 implements MigrationInterface {
  name = 'AddModelFacilityCategoryAndImageTables1721581372492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "name_en" text, "slug" text NOT NULL, "slug_en" text, "description" text, "description_en" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug"), CONSTRAINT "UQ_2fe48bf55eedfd571443c0d8991" UNIQUE ("slug_en"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "facility" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "name_en" text, "slug" text NOT NULL, "slug_en" text, "description" text, "description_en" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1c8150565c89deac41a13e48d5c" UNIQUE ("slug"), CONSTRAINT "UQ_1de4901d77be28acf5728eaf86e" UNIQUE ("slug_en"), CONSTRAINT "PK_07c6c82781d105a680b5c265be6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "image_asset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text NOT NULL, "file_name" text NOT NULL, "description" text, "description_en" text, "public_id" text, "width" integer, "height" integer, "format" text, "resource_type" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ebb19157be1103b6ab97049321e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model_category" ("modelId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_19d6062c0a712b50b7fe2e592c0" PRIMARY KEY ("modelId", "categoryId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d1fb398d856212310bb32115a3" ON "model_category" ("modelId") `);
    await queryRunner.query(`CREATE INDEX "IDX_9688e27d500a9de76e4e96a78f" ON "model_category" ("categoryId") `);
    await queryRunner.query(
      `CREATE TABLE "model_facility" ("modelId" uuid NOT NULL, "facilityId" uuid NOT NULL, CONSTRAINT "PK_56ee0d1f7eefec6727d6c9287e2" PRIMARY KEY ("modelId", "facilityId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_dcf81bc92b7cdb6ce481065d93" ON "model_facility" ("modelId") `);
    await queryRunner.query(`CREATE INDEX "IDX_2ec34d050de3491c4542a54878" ON "model_facility" ("facilityId") `);
    await queryRunner.query(
      `ALTER TABLE "model_category" ADD CONSTRAINT "FK_d1fb398d856212310bb32115a37" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_category" ADD CONSTRAINT "FK_9688e27d500a9de76e4e96a78f2" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_facility" ADD CONSTRAINT "FK_dcf81bc92b7cdb6ce481065d935" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_facility" ADD CONSTRAINT "FK_2ec34d050de3491c4542a54878c" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_facility" DROP CONSTRAINT "FK_2ec34d050de3491c4542a54878c"`);
    await queryRunner.query(`ALTER TABLE "model_facility" DROP CONSTRAINT "FK_dcf81bc92b7cdb6ce481065d935"`);
    await queryRunner.query(`ALTER TABLE "model_category" DROP CONSTRAINT "FK_9688e27d500a9de76e4e96a78f2"`);
    await queryRunner.query(`ALTER TABLE "model_category" DROP CONSTRAINT "FK_d1fb398d856212310bb32115a37"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2ec34d050de3491c4542a54878"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dcf81bc92b7cdb6ce481065d93"`);
    await queryRunner.query(`DROP TABLE "model_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9688e27d500a9de76e4e96a78f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1fb398d856212310bb32115a3"`);
    await queryRunner.query(`DROP TABLE "model_category"`);
    await queryRunner.query(`DROP TABLE "image_asset"`);
    await queryRunner.query(`DROP TABLE "model"`);
    await queryRunner.query(`DROP TABLE "facility"`);
    await queryRunner.query(`DROP TABLE "category"`);
  }
}
