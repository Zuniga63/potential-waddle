import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShowBinntuReviews1766491984212 implements MigrationInterface {
    name = 'AddShowBinntuReviews1766491984212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transport" ADD "show_binntu_reviews" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "guide" ADD "show_binntu_reviews" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "commerce" ADD "show_binntu_reviews" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "show_binntu_reviews" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "show_binntu_reviews" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "lodging" ADD "show_binntu_reviews" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "show_binntu_reviews"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "show_binntu_reviews"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "show_binntu_reviews"`);
        await queryRunner.query(`ALTER TABLE "commerce" DROP COLUMN "show_binntu_reviews"`);
        await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "show_binntu_reviews"`);
        await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "show_binntu_reviews"`);
    }

}
