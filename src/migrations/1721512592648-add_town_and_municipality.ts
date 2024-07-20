import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTownAndMunicipality1721512592648 implements MigrationInterface {
  name = 'AddTownAndMunicipality1721512592648';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "municipality" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "capital" text, "calling_code" text, "postal_code" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b5ccf3ba4eff316a528f74c08a" UNIQUE ("name"), CONSTRAINT "PK_281ad341f20df7c41b83a182e2a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "town" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "description_en" text, "flag" jsonb, "shield" jsonb, "image" jsonb, "postal_code" text, "url" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "municipality_id" uuid, CONSTRAINT "UQ_9511a4e785196486335a4f688e2" UNIQUE ("name"), CONSTRAINT "PK_983b203100527a0c323c5e3b106" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "town" ADD CONSTRAINT "FK_5833dc4ef6a225b78d9631e72a6" FOREIGN KEY ("municipality_id") REFERENCES "municipality"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "town" DROP CONSTRAINT "FK_5833dc4ef6a225b78d9631e72a6"`);
    await queryRunner.query(`DROP TABLE "town"`);
    await queryRunner.query(`DROP TABLE "municipality"`);
  }
}
