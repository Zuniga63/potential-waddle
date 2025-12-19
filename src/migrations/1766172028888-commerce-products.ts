import { MigrationInterface, QueryRunner } from "typeorm";

export class CommerceProducts1766172028888 implements MigrationInterface {
    name = 'CommerceProducts1766172028888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "commerce_product_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "commerce_product_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_c8d3ded27b9a5a0b79b01fd54d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."commerce_product_type_enum" AS ENUM('product', 'service')`);
        await queryRunner.query(`CREATE TABLE "commerce_product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."commerce_product_type_enum" NOT NULL DEFAULT 'product', "name" text NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "sku" text, "is_available" boolean NOT NULL DEFAULT true, "stock" integer, "order" smallint NOT NULL DEFAULT '0', "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "commerce_id" uuid, CONSTRAINT "PK_7cd0cf600696b4005542d4ef57c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "commerce_product_image" ADD CONSTRAINT "FK_e847c5e8d81a3c8763cb075185f" FOREIGN KEY ("commerce_product_id") REFERENCES "commerce_product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commerce_product_image" ADD CONSTRAINT "FK_2e8320aa67c510c7ea91539f9a1" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commerce_product" ADD CONSTRAINT "FK_d30bff956479dd4733ed48d3e61" FOREIGN KEY ("commerce_id") REFERENCES "commerce"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "commerce_product" DROP CONSTRAINT "FK_d30bff956479dd4733ed48d3e61"`);
        await queryRunner.query(`ALTER TABLE "commerce_product_image" DROP CONSTRAINT "FK_2e8320aa67c510c7ea91539f9a1"`);
        await queryRunner.query(`ALTER TABLE "commerce_product_image" DROP CONSTRAINT "FK_e847c5e8d81a3c8763cb075185f"`);
        await queryRunner.query(`DROP TABLE "commerce_product"`);
        await queryRunner.query(`DROP TYPE "public"."commerce_product_type_enum"`);
        await queryRunner.query(`DROP TABLE "commerce_product_image"`);
    }

}
