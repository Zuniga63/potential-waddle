import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPointTable1730159254867 implements MigrationInterface {
  name = 'AddUserPointTable1730159254867';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_point" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "points_earned" smallint NOT NULL, "points_redeemed" smallint NOT NULL DEFAULT '0', "distance_travelled" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "review_id" uuid, "place_id" uuid, "town_id" uuid NOT NULL, CONSTRAINT "UQ_2dfca9bb730649809f3e6cf652a" UNIQUE ("user_id", "review_id", "place_id", "town_id"), CONSTRAINT "PK_8cbdfb12d62030c7eac59d19dd5" PRIMARY KEY ("id")); COMMENT ON COLUMN "user_point"."distance_travelled" IS 'Distance travelled in meters'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_point" ADD CONSTRAINT "FK_1b5e1a206762507df7d8ed8cef7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_point" ADD CONSTRAINT "FK_875e9d7c738542c6141cfa5957e" FOREIGN KEY ("review_id") REFERENCES "review"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_point" ADD CONSTRAINT "FK_7569a53c21bacd98b61c32d4398" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_point" ADD CONSTRAINT "FK_e2dcf2807f473ff693769a03c14" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_point" DROP CONSTRAINT "FK_e2dcf2807f473ff693769a03c14"`);
    await queryRunner.query(`ALTER TABLE "user_point" DROP CONSTRAINT "FK_7569a53c21bacd98b61c32d4398"`);
    await queryRunner.query(`ALTER TABLE "user_point" DROP CONSTRAINT "FK_875e9d7c738542c6141cfa5957e"`);
    await queryRunner.query(`ALTER TABLE "user_point" DROP CONSTRAINT "FK_1b5e1a206762507df7d8ed8cef7"`);
    await queryRunner.query(`DROP TABLE "user_point"`);
  }
}
