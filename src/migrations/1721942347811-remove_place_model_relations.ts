import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePlaceModelRelations1721942347811 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_632e9bf4461567d50d91607733d"`);
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_77d9549751bab0cdec48e15631a"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_d2d94b90b1b87b16c52e18d980a"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_be5377f9c9e1b717f783376ac49"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898"`);
    await queryRunner.query(`ALTER TABLE "place_review" DROP CONSTRAINT "FK_17179acad8f27672f8ca5c81fad"`);
    await queryRunner.query(`ALTER TABLE "place_review" DROP CONSTRAINT "FK_449e082907f0c59f9e33773239f"`);
    await queryRunner.query(`ALTER TABLE "place_location" DROP CONSTRAINT "FK_6d7dce1290cce202094db1f742b"`);
    await queryRunner.query(`ALTER TABLE "place_info" DROP CONSTRAINT "FK_e536be11005d454c1df8540dbdf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_632e9bf4461567d50d91607733"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77d9549751bab0cdec48e15631"`);
    await queryRunner.query(`DROP TABLE "place_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2d94b90b1b87b16c52e18d980"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be5377f9c9e1b717f783376ac4"`);
    await queryRunner.query(`DROP TABLE "place_facility"`);
    await queryRunner.query(`DROP TABLE "place_image"`);
    await queryRunner.query(`DROP TABLE "place_review"`);
    await queryRunner.query(`DROP TABLE "place_location"`);
    await queryRunner.query(`DROP TABLE "place_info"`);
  }

  public async down(): Promise<void> {
    // This migration is irreversible
  }
}
