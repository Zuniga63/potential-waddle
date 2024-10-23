import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReviewTablesRelationsAndAddHistoryTable1729690635113 implements MigrationInterface {
  name = 'UpdateReviewTablesRelationsAndAddHistoryTable1729690635113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_eb192dab88c8168fee0d2c54dfc"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_f0a1a48c40bcb0585f111015e5a"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_81446f2ee100305f42645d4d6c2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_eb192dab88c8168fee0d2c54df"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0a1a48c40bcb0585f111015e5"`);
    await queryRunner.query(
      `CREATE TYPE "public"."review_status_history_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "review_status_history" ("id" SERIAL NOT NULL, "status" "public"."review_status_history_status_enum" NOT NULL, "reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "review_id" uuid, CONSTRAINT "PK_26f96d31902028413da3d31e798" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "PK_39cdb37c460fafccdfad3b131f6"`);
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "PK_eb192dab88c8168fee0d2c54dfc" PRIMARY KEY ("imageResourceId")`,
    );
    await queryRunner.query(`ALTER TABLE "review_image" DROP COLUMN "reviewId"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "PK_eb192dab88c8168fee0d2c54dfc"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP COLUMN "imageResourceId"`);
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "approved"`);
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "review_image" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "PK_953505a56c4a0c9b07726d2f09a" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_image_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD "status" "public"."review_image_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "review_image" ADD "review_id" uuid`);
    await queryRunner.query(`ALTER TABLE "review_image" ADD "image_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "UQ_96d1c5a775ed6c9e6d49ea0b7e4" UNIQUE ("image_id")`,
    );
    await queryRunner.query(`CREATE TYPE "public"."review_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
    await queryRunner.query(
      `ALTER TABLE "review" ADD "status" "public"."review_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "review" ADD "approved_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "review" ADD "approved_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "is_public" SET DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "comment" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "comment" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_90199fd60eca06db0fa71259ca8" FOREIGN KEY ("review_id") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_96d1c5a775ed6c9e6d49ea0b7e4" FOREIGN KEY ("image_id") REFERENCES "image_resource"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_status_history" ADD CONSTRAINT "FK_635db1b86ff2ae52ede8488eff8" FOREIGN KEY ("review_id") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_81446f2ee100305f42645d4d6c2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_1a110639d105c23053329067594" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_1a110639d105c23053329067594"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_81446f2ee100305f42645d4d6c2"`);
    await queryRunner.query(`ALTER TABLE "review_status_history" DROP CONSTRAINT "FK_635db1b86ff2ae52ede8488eff8"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_96d1c5a775ed6c9e6d49ea0b7e4"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_90199fd60eca06db0fa71259ca8"`);
    await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "comment" SET DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "comment" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "is_public" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "approved_by_id"`);
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "approved_at"`);
    await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."review_status_enum"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "UQ_96d1c5a775ed6c9e6d49ea0b7e4"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP COLUMN "image_id"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP COLUMN "review_id"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."review_image_status_enum"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "PK_953505a56c4a0c9b07726d2f09a"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "review" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "review" ADD "approved" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "review_image" ADD "imageResourceId" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "PK_eb192dab88c8168fee0d2c54dfc" PRIMARY KEY ("imageResourceId")`,
    );
    await queryRunner.query(`ALTER TABLE "review_image" ADD "reviewId" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "PK_eb192dab88c8168fee0d2c54dfc"`);
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "PK_39cdb37c460fafccdfad3b131f6" PRIMARY KEY ("reviewId", "imageResourceId")`,
    );
    await queryRunner.query(`DROP TABLE "review_status_history"`);
    await queryRunner.query(`DROP TYPE "public"."review_status_history_status_enum"`);
    await queryRunner.query(`CREATE INDEX "IDX_f0a1a48c40bcb0585f111015e5" ON "review_image" ("reviewId") `);
    await queryRunner.query(`CREATE INDEX "IDX_eb192dab88c8168fee0d2c54df" ON "review_image" ("imageResourceId") `);
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_81446f2ee100305f42645d4d6c2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_f0a1a48c40bcb0585f111015e5a" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_eb192dab88c8168fee0d2c54dfc" FOREIGN KEY ("imageResourceId") REFERENCES "image_resource"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
