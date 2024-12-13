import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransportTable1734049983532 implements MigrationInterface {
  name = 'AddTransportTable1734049983532';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transport" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "firstName" text NOT NULL, "lastName" text NOT NULL, "documentType" text NOT NULL, "document" text NOT NULL, "phone" text NOT NULL, "whatsapp" text, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "isAvailable" boolean NOT NULL DEFAULT true, "licensePlate" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "REL_d4f2ffd31b71e58ebec3627290" UNIQUE ("user_id"), CONSTRAINT "PK_298d9594bee72eca3d7a4032a39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_category" ("transport_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_854c9e9d7b23fff77abd6943937" PRIMARY KEY ("transport_id", "category_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2b6edbd606d95aff5793841fc9" ON "transport_category" ("transport_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_4317c41d7073f66bdec6ede948" ON "transport_category" ("category_id") `);
    await queryRunner.query(
      `ALTER TABLE "transport" ADD CONSTRAINT "FK_dea317e6cece215c02caca907ec" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport" ADD CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_category" ADD CONSTRAINT "FK_2b6edbd606d95aff5793841fc9b" FOREIGN KEY ("transport_id") REFERENCES "transport"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_category" ADD CONSTRAINT "FK_4317c41d7073f66bdec6ede9486" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transport_category" DROP CONSTRAINT "FK_4317c41d7073f66bdec6ede9486"`);
    await queryRunner.query(`ALTER TABLE "transport_category" DROP CONSTRAINT "FK_2b6edbd606d95aff5793841fc9b"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP CONSTRAINT "FK_dea317e6cece215c02caca907ec"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4317c41d7073f66bdec6ede948"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2b6edbd606d95aff5793841fc9"`);
    await queryRunner.query(`DROP TABLE "transport_category"`);
    await queryRunner.query(`DROP TABLE "transport"`);
  }
}
