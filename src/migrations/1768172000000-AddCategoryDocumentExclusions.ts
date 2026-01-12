import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryDocumentExclusions1768172000000 implements MigrationInterface {
  name = 'AddCategoryDocumentExclusions1768172000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "category_document_exclusion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category_id" uuid NOT NULL,
        "document_type_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_category_document_exclusion" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_category_document_exclusion" UNIQUE ("category_id", "document_type_id"),
        CONSTRAINT "FK_category_document_exclusion_category" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_category_document_exclusion_document_type" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_category_document_exclusion_category" ON "category_document_exclusion" ("category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_category_document_exclusion_document_type" ON "category_document_exclusion" ("document_type_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_category_document_exclusion_document_type"`);
    await queryRunner.query(`DROP INDEX "IDX_category_document_exclusion_category"`);
    await queryRunner.query(`DROP TABLE "category_document_exclusion"`);
  }
}
