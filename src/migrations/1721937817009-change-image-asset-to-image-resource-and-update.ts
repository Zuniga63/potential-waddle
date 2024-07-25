import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeImageAssetToImageResourceAndUpdate1721937817009 implements MigrationInterface {
  name = 'ChangeImageAssetToImageResourceAndUpdate1721937817009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "image_asset"`);
    await queryRunner.query(
      `CREATE TYPE "public"."image_resource_provider_enum" AS ENUM('cloudinary', 'aws', 'google')`,
    );
    await queryRunner.query(
      `CREATE TABLE "image_resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text NOT NULL, "file_name" text, "description" text, "description_en" text, "public_id" text, "width" integer, "height" integer, "format" text, "resource_type" text, "provider" "public"."image_resource_provider_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e91b9eb58a096638369851bf2a8" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "image_resource"`);
    await queryRunner.query(`DROP TYPE "public"."image_resource_provider_enum"`);
  }
}
