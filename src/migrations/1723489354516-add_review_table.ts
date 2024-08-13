import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewTable1723489354516 implements MigrationInterface {
  name = 'AddReviewTable1723489354516';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" smallint NOT NULL DEFAULT '5', "is_public" boolean NOT NULL DEFAULT false, "comment" text NOT NULL DEFAULT '', "approved" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "place_id" uuid, CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "review_image" ("reviewId" uuid NOT NULL, "imageResourceId" uuid NOT NULL, CONSTRAINT "PK_39cdb37c460fafccdfad3b131f6" PRIMARY KEY ("reviewId", "imageResourceId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_f0a1a48c40bcb0585f111015e5" ON "review_image" ("reviewId") `);
    await queryRunner.query(`CREATE INDEX "IDX_eb192dab88c8168fee0d2c54df" ON "review_image" ("imageResourceId") `);
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_81446f2ee100305f42645d4d6c2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_d11650864e93b23444d1634d766" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_f0a1a48c40bcb0585f111015e5a" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_eb192dab88c8168fee0d2c54dfc" FOREIGN KEY ("imageResourceId") REFERENCES "image_resource"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_eb192dab88c8168fee0d2c54dfc"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_f0a1a48c40bcb0585f111015e5a"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_d11650864e93b23444d1634d766"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_81446f2ee100305f42645d4d6c2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_eb192dab88c8168fee0d2c54df"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0a1a48c40bcb0585f111015e5"`);
    await queryRunner.query(`DROP TABLE "review_image"`);
    await queryRunner.query(`DROP TABLE "review"`);
  }
}
