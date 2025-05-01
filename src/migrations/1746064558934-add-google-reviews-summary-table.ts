import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleReviewsSummaryTable1746064558934 implements MigrationInterface {
  name = 'AddGoogleReviewsSummaryTable1746064558934';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "google_review" ("id" SERIAL NOT NULL, "entity_id" character varying NOT NULL, "entity_type" character varying NOT NULL, "author_name" character varying, "rating" double precision, "text" text, "review_url" character varying, "review_date" TIMESTAMP, "review_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "pinecone_id" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d0f6d15b3e03e18586ec58ad303" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea9b53abd20e77a62926ca169b" ON "google_review" ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "google_review_summary" ("id" SERIAL NOT NULL, "entity_id" character varying NOT NULL, "entity_type" character varying NOT NULL, "question" character varying NOT NULL, "content" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4aeb25858202282463e9814b3f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99295fafb5b3bfc0d165a1dc9d" ON "google_review_summary" ("entity_type", "entity_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_99295fafb5b3bfc0d165a1dc9d"`);
    await queryRunner.query(`DROP TABLE "google_review_summary"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ea9b53abd20e77a62926ca169b"`);
    await queryRunner.query(`DROP TABLE "google_review"`);
  }
}
