import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleFieldsToModels1742441878706 implements MigrationInterface {
  name = 'AddGoogleFieldsToModels1742441878706';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "commerce" ADD "google_maps_rating" double precision`);
    await queryRunner.query(`ALTER TABLE "commerce" ADD "google_maps_id" text`);
    await queryRunner.query(`ALTER TABLE "commerce" ADD "google_maps_reviews_count" integer`);
    await queryRunner.query(`ALTER TABLE "commerce" ADD "show_google_maps_reviews" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "commerce" ADD "google_maps_name" text`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "google_maps_rating" double precision`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "google_maps_id" text`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "google_maps_reviews_count" integer`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "show_google_maps_reviews" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "google_maps_name" text`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "google_maps_rating" double precision`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "google_maps_id" text`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "google_maps_reviews_count" integer`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "show_google_maps_reviews" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "google_maps_name" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "google_maps_name"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "show_google_maps_reviews"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "google_maps_reviews_count"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "google_maps_id"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "google_maps_rating"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "google_maps_name"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "show_google_maps_reviews"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "google_maps_reviews_count"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "google_maps_id"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "google_maps_rating"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "google_maps_name"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "show_google_maps_reviews"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "google_maps_reviews_count"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "google_maps_id"`);
    await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "google_maps_rating"`);
  }
}
