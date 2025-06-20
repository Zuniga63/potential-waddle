import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaFormatAndVideoUrlToPlaceImage1750395655507 implements MigrationInterface {
  name = 'AddMediaFormatAndVideoUrlToPlaceImage1750395655507';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place_image" ADD "media_format" character varying(50) DEFAULT 'image'`);
    await queryRunner.query(`ALTER TABLE "place_image" ADD "video_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place_image" DROP COLUMN "video_url"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP COLUMN "media_format"`);
  }
}
