import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateToDocumentType1768171500000 implements MigrationInterface {
  name = 'AddTemplateToDocumentType1768171500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "document_type"
      ADD COLUMN "template_url" varchar(500),
      ADD COLUMN "template_file_name" varchar(255),
      ADD COLUMN "template_gcp_path" varchar(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "document_type"
      DROP COLUMN "template_url",
      DROP COLUMN "template_file_name",
      DROP COLUMN "template_gcp_path"
    `);
  }
}
