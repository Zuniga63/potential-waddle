import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguageModel1721935643909 implements MigrationInterface {
  name = 'AddLanguageModel1721935643909';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "language" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7df7d1e250ea2a416f078a631fb" UNIQUE ("name"), CONSTRAINT "UQ_465b3173cdddf0ac2d3fe73a33c" UNIQUE ("code"), CONSTRAINT "PK_cc0a99e710eb3733f6fb42b1d4c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "language"`);
  }
}
