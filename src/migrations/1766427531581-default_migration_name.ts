import { MigrationInterface, QueryRunner } from "typeorm";

export class DefaultMigrationName1766427531581 implements MigrationInterface {
    name = 'DefaultMigrationName1766427531581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transport" ADD "points" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transport" ADD "rating" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transport" ADD "review_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "guide" ADD "points" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "guide" ADD "rating" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "guide" ADD "review_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "guide" ADD "town_id" uuid`);
        await queryRunner.query(`ALTER TABLE "review" ADD "restaurant_id" uuid`);
        await queryRunner.query(`ALTER TABLE "review" ADD "transport_id" uuid`);
        await queryRunner.query(`ALTER TABLE "review" ADD "guide_id" uuid`);
        await queryRunner.query(`ALTER TABLE "guide" ADD CONSTRAINT "FK_958aea0517e74c04c4ad4206be3" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_9e0a456057cd16f910bfad306ad" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_3d1f28d6a0bb8f33c4ce12a15af" FOREIGN KEY ("transport_id") REFERENCES "transport"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_fbea986c57eff5d914093ec0796" FOREIGN KEY ("guide_id") REFERENCES "guide"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_fbea986c57eff5d914093ec0796"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_3d1f28d6a0bb8f33c4ce12a15af"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_9e0a456057cd16f910bfad306ad"`);
        await queryRunner.query(`ALTER TABLE "guide" DROP CONSTRAINT "FK_958aea0517e74c04c4ad4206be3"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "guide_id"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "transport_id"`);
        await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "restaurant_id"`);
        await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "town_id"`);
        await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "review_count"`);
        await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "points"`);
        await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "review_count"`);
        await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "points"`);
    }

}
