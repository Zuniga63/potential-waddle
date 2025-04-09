import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLodgingsPlacesJoinTable1744160328571 implements MigrationInterface {
  name = 'AddLodgingsPlacesJoinTable1744160328571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lodging_place" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "distance" double precision NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "lodging_id" uuid, "place_id" uuid, CONSTRAINT "PK_7f4836d3340fa60cbd098bcc4a2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_place" ADD CONSTRAINT "FK_32ab5a40051bdb303f227b7da7d" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_place" ADD CONSTRAINT "FK_d4755ab65a6a1ff3fecf43a9b7e" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging_place" DROP CONSTRAINT "FK_d4755ab65a6a1ff3fecf43a9b7e"`);
    await queryRunner.query(`ALTER TABLE "lodging_place" DROP CONSTRAINT "FK_32ab5a40051bdb303f227b7da7d"`);
    await queryRunner.query(`DROP TABLE "lodging_place"`);
  }
}
