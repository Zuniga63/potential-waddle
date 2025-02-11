import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuideTable1739234287256 implements MigrationInterface {
  name = 'AddGuideTable1739234287256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "guide_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "guide_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_74f651a798b8425272b67f3d654" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "guide" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" text NOT NULL, "email" text NOT NULL, "first_name" text NOT NULL, "last_name" text NOT NULL, "document_type" text NOT NULL, "document" text NOT NULL, "phone" text NOT NULL, "whatsapp" text NOT NULL, "address" text NOT NULL, "biography" text, "languages" text, "facebook" text, "instagram" text, "youtube" text, "tiktok" text, "is_available" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid NOT NULL, "user_id" uuid, CONSTRAINT "UQ_792ebb71d04878eb8972424facf" UNIQUE ("slug"), CONSTRAINT "REL_b47be5f3ef73194972be4a1167" UNIQUE ("user_id"), CONSTRAINT "PK_fe92b4af32150e0580d37eacaef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "guide_category" ("guide_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_c55d51089cca87c7ab64d9a2d49" PRIMARY KEY ("guide_id", "category_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2a672b25e2223efa056000e8aa" ON "guide_category" ("guide_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_ad6b1450d38316de7579bbb91b" ON "guide_category" ("category_id") `);
    await queryRunner.query(
      `ALTER TABLE "guide_image" ADD CONSTRAINT "FK_b0ff92213175825571bf1577726" FOREIGN KEY ("guide_id") REFERENCES "guide"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guide_image" ADD CONSTRAINT "FK_c7ab4f3c09491409e3c5d6d5218" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guide" ADD CONSTRAINT "FK_958aea0517e74c04c4ad4206be3" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guide" ADD CONSTRAINT "FK_b47be5f3ef73194972be4a11679" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guide_category" ADD CONSTRAINT "FK_2a672b25e2223efa056000e8aac" FOREIGN KEY ("guide_id") REFERENCES "guide"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "guide_category" ADD CONSTRAINT "FK_ad6b1450d38316de7579bbb91be" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide_category" DROP CONSTRAINT "FK_ad6b1450d38316de7579bbb91be"`);
    await queryRunner.query(`ALTER TABLE "guide_category" DROP CONSTRAINT "FK_2a672b25e2223efa056000e8aac"`);
    await queryRunner.query(`ALTER TABLE "guide" DROP CONSTRAINT "FK_b47be5f3ef73194972be4a11679"`);
    await queryRunner.query(`ALTER TABLE "guide" DROP CONSTRAINT "FK_958aea0517e74c04c4ad4206be3"`);
    await queryRunner.query(`ALTER TABLE "guide_image" DROP CONSTRAINT "FK_c7ab4f3c09491409e3c5d6d5218"`);
    await queryRunner.query(`ALTER TABLE "guide_image" DROP CONSTRAINT "FK_b0ff92213175825571bf1577726"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ad6b1450d38316de7579bbb91b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2a672b25e2223efa056000e8aa"`);
    await queryRunner.query(`DROP TABLE "guide_category"`);
    await queryRunner.query(`DROP TABLE "guide"`);
    await queryRunner.query(`DROP TABLE "guide_image"`);
  }
}
