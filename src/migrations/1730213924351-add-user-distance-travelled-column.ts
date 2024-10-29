import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDistanceTravelledColumn1730213924351 implements MigrationInterface {
  name = 'AddUserDistanceTravelledColumn1730213924351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "distance_travelled" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`COMMENT ON COLUMN "users"."distance_travelled" IS 'Distance travelled in meters'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "users"."distance_travelled" IS 'Distance travelled in meters'`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "distance_travelled"`);
  }
}
