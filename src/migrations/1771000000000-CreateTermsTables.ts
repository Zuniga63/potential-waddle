import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTermsTables1771000000000 implements MigrationInterface {
  name = 'CreateTermsTables1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // * ----------------------------------------------------------------------------------------------------------------
    // * ENUM TYPES
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(
      `CREATE TYPE "public"."terms_type_enum" AS ENUM ('user', 'lodging', 'restaurant', 'commerce', 'transport', 'guide')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."terms_format_enum" AS ENUM ('markdown', 'pdf')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."terms_context_enum" AS ENUM ('registration', 'user_login_check', 'lodging_creation', 'restaurant_creation', 'commerce_creation', 'transport_creation', 'guide_creation')`,
    );

    // * ----------------------------------------------------------------------------------------------------------------
    // * TERMS_DOCUMENTS TABLE
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "terms_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."terms_type_enum" NOT NULL,
        "format" "public"."terms_format_enum" NOT NULL,
        "content" text,
        "file_url" text,
        "is_active" boolean NOT NULL DEFAULT false,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_terms_documents" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_terms_documents_type" ON "terms_documents" ("type")`,
    );

    // Partial unique index — PostgreSQL-native: only one active document per type
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_terms_documents_type_active" ON "terms_documents" ("type") WHERE "is_active" = true`,
    );

    await queryRunner.query(`
      ALTER TABLE "terms_documents"
      ADD CONSTRAINT "FK_terms_documents_created_by"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // * ----------------------------------------------------------------------------------------------------------------
    // * TERMS_ACCEPTANCES TABLE
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "terms_acceptances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "terms_document_id" uuid NOT NULL,
        "accepted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "ip_address" varchar(64) NOT NULL,
        "user_agent" text,
        "context" "public"."terms_context_enum" NOT NULL,
        CONSTRAINT "PK_terms_acceptances" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_terms_acceptances_user_id" ON "terms_acceptances" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_terms_acceptances_terms_document_id" ON "terms_acceptances" ("terms_document_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_terms_acceptances_user_doc" ON "terms_acceptances" ("user_id", "terms_document_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "terms_acceptances"
      ADD CONSTRAINT "FK_terms_acceptances_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "terms_acceptances"
      ADD CONSTRAINT "FK_terms_acceptances_document"
      FOREIGN KEY ("terms_document_id") REFERENCES "terms_documents"("id") ON DELETE CASCADE
    `);

    // * ----------------------------------------------------------------------------------------------------------------
    // * SEED 6 PLACEHOLDER ACTIVE DOCUMENTS (one per type)
    // * ----------------------------------------------------------------------------------------------------------------
    await queryRunner.query(`
      INSERT INTO "terms_documents" ("type", "format", "content", "is_active") VALUES
      ('user', 'markdown', E'# Términos y Condiciones de Usuario\\n\\n(Placeholder — pending legal review)', true),
      ('lodging', 'markdown', E'# Términos y Condiciones de Hospedaje\\n\\n(Placeholder — pending legal review)', true),
      ('restaurant', 'markdown', E'# Términos y Condiciones de Restaurante\\n\\n(Placeholder — pending legal review)', true),
      ('commerce', 'markdown', E'# Términos y Condiciones de Comercio\\n\\n(Placeholder — pending legal review)', true),
      ('transport', 'markdown', E'# Términos y Condiciones de Transporte\\n\\n(Placeholder — pending legal review)', true),
      ('guide', 'markdown', E'# Términos y Condiciones de Guía Turístico\\n\\n(Placeholder — pending legal review)', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse order: FKs → indexes → tables → enum types
    await queryRunner.query(
      `ALTER TABLE "terms_acceptances" DROP CONSTRAINT "FK_terms_acceptances_document"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_acceptances" DROP CONSTRAINT "FK_terms_acceptances_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms_documents" DROP CONSTRAINT "FK_terms_documents_created_by"`,
    );

    await queryRunner.query(`DROP INDEX "public"."UQ_terms_acceptances_user_doc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_terms_acceptances_terms_document_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_terms_acceptances_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_terms_documents_type_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_terms_documents_type"`);

    await queryRunner.query(`DROP TABLE "terms_acceptances"`);
    await queryRunner.query(`DROP TABLE "terms_documents"`);

    await queryRunner.query(`DROP TYPE "public"."terms_context_enum"`);
    await queryRunner.query(`DROP TYPE "public"."terms_format_enum"`);
    await queryRunner.query(`DROP TYPE "public"."terms_type_enum"`);
  }
}
