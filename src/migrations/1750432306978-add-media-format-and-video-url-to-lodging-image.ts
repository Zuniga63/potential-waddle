import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaFormatAndVideoUrlToLodgingImage1750432306978 implements MigrationInterface {
  name = 'AddMediaFormatAndVideoUrlToLodgingImage1750432306978';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging_image" ADD "media_format" character varying(50) DEFAULT 'image'`);
    await queryRunner.query(`ALTER TABLE "lodging_image" ADD "video_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging_image" DROP COLUMN "video_url"`);
    await queryRunner.query(`ALTER TABLE "lodging_image" DROP COLUMN "media_format"`);
  }
}
