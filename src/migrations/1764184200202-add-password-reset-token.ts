import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetToken1764184200202 implements MigrationInterface {
  name = 'AddPasswordResetToken1764184200202';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_reset_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying(64) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "UQ_6c50e3a3bee2912c1153c63aa64" UNIQUE ("token"), CONSTRAINT "PK_838af121380dfe3a6330e04f5bb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_6c50e3a3bee2912c1153c63aa6" ON "password_reset_token" ("token")`);
    await queryRunner.query(`CREATE INDEX "IDX_af65b1bf016b7f2cfdf0ebb1ff" ON "password_reset_token" ("expires_at")`);
    await queryRunner.query(
      `ALTER TABLE "password_reset_token" ADD CONSTRAINT "FK_7eabb22ed38459ffc24dc8b415d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "password_reset_token" DROP CONSTRAINT "FK_7eabb22ed38459ffc24dc8b415d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_af65b1bf016b7f2cfdf0ebb1ff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6c50e3a3bee2912c1153c63aa6"`);
    await queryRunner.query(`DROP TABLE "password_reset_token"`);
  }
}
