import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransportTable1734653674637 implements MigrationInterface {
  name = 'AddTransportTable1734653674637';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transport" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "first_name" text NOT NULL, "last_name" text NOT NULL, "document_type" text NOT NULL, "document" text NOT NULL, "phone" text NOT NULL, "whatsapp" text NOT NULL, "start_time" text, "end_time" text, "is_available" boolean NOT NULL DEFAULT true, "license_plate" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid NOT NULL, "user_id" uuid, CONSTRAINT "REL_d4f2ffd31b71e58ebec3627290" UNIQUE ("user_id"), CONSTRAINT "PK_298d9594bee72eca3d7a4032a39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport" ADD CONSTRAINT "FK_dea317e6cece215c02caca907ec" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport" ADD CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_category" ADD CONSTRAINT "FK_2b6edbd606d95aff5793841fc9b" FOREIGN KEY ("transport_id") REFERENCES "transport"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transport_category" DROP CONSTRAINT "FK_2b6edbd606d95aff5793841fc9b"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP CONSTRAINT "FK_d4f2ffd31b71e58ebec36272901"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP CONSTRAINT "FK_dea317e6cece215c02caca907ec"`);
    await queryRunner.query(`DROP TABLE "transport"`);
  }
}
