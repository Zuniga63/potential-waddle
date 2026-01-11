import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentsModule1768169030174 implements MigrationInterface {
    name = 'AddDocumentsModule1768169030174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."document_entity_type_enum" AS ENUM('lodging', 'restaurant', 'guide', 'commerce', 'transport')`);
        await queryRunner.query(`CREATE TYPE "public"."document_status_enum" AS ENUM('pending', 'approved', 'rejected', 'expired')`);
        await queryRunner.query(`CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "document_type_id" uuid NOT NULL, "entity_type" "public"."document_entity_type_enum" NOT NULL, "entity_id" uuid NOT NULL, "file_name" character varying(255) NOT NULL, "url" text NOT NULL, "gcp_path" text NOT NULL, "mime_type" character varying(100) NOT NULL, "size" integer NOT NULL DEFAULT '0', "expiration_date" date, "status" "public"."document_status_enum" NOT NULL DEFAULT 'pending', "rejection_reason" text, "uploaded_by_id" uuid, "reviewed_by_id" uuid, "reviewed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."document_type_category_enum" AS ENUM('legal', 'personal', 'operational', 'fiscal', 'other')`);
        await queryRunner.query(`CREATE TABLE "document_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" character varying(255), "category" "public"."document_type_category_enum" NOT NULL DEFAULT 'other', "has_expiration" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2e1aa55eac1947ddf3221506edb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."town_document_requirement_entity_type_enum" AS ENUM('lodging', 'restaurant', 'guide', 'commerce', 'transport')`);
        await queryRunner.query(`CREATE TABLE "town_document_requirement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "town_id" uuid NOT NULL, "document_type_id" uuid NOT NULL, "entity_type" "public"."town_document_requirement_entity_type_enum" NOT NULL, "is_required" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_02541343c7e3bbaf634cddcc206" UNIQUE ("town_id", "document_type_id", "entity_type"), CONSTRAINT "PK_aa60abfef54bcb6cb570f5b3cf0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_6b439665ef703bf850df3f12134" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_1b69aad62985f354d9aa36c995d" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_c64134f42f58f2e0ebbfca5d6bf" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "town_document_requirement" ADD CONSTRAINT "FK_498c09600324401fd97291184ad" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "town_document_requirement" ADD CONSTRAINT "FK_d6800623051483cf807dd2b11bc" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "town_document_requirement" DROP CONSTRAINT "FK_d6800623051483cf807dd2b11bc"`);
        await queryRunner.query(`ALTER TABLE "town_document_requirement" DROP CONSTRAINT "FK_498c09600324401fd97291184ad"`);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_c64134f42f58f2e0ebbfca5d6bf"`);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_1b69aad62985f354d9aa36c995d"`);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_6b439665ef703bf850df3f12134"`);
        await queryRunner.query(`DROP TABLE "town_document_requirement"`);
        await queryRunner.query(`DROP TYPE "public"."town_document_requirement_entity_type_enum"`);
        await queryRunner.query(`DROP TABLE "document_type"`);
        await queryRunner.query(`DROP TYPE "public"."document_type_category_enum"`);
        await queryRunner.query(`DROP TABLE "document"`);
        await queryRunner.query(`DROP TYPE "public"."document_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."document_entity_type_enum"`);
    }

}
