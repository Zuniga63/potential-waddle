import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageToCategory1766187710678 implements MigrationInterface {
    name = 'AddImageToCategory1766187710678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD "image_resource_id" uuid`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_df45b0f8aeef3e3d29b1a277b62" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_df45b0f8aeef3e3d29b1a277b62"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "image_resource_id"`);
    }

}
