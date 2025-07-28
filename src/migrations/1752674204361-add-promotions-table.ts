import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionsTable1752674204361 implements MigrationInterface {
  name = 'AddPromotionsTable1752674204361';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "promotion" (
                "id" SERIAL NOT NULL,
                "entity_id" character varying NOT NULL,
                "entity_type" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" text NOT NULL,
                "valid_from" TIMESTAMP NOT NULL,
                "valid_to" TIMESTAMP NOT NULL,
                "image" character varying NOT NULL,
                "value" double precision NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_promotion_id" PRIMARY KEY ("id")
            )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_promotion_entity_type_entity_id" ON "promotion" ("entity_type", "entity_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_promotion_entity_type_entity_id"`);
    await queryRunner.query(`DROP TABLE "promotion"`);
  }
}
