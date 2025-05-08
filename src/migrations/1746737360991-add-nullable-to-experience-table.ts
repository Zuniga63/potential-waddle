import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNullableToExperienceTable1746737360991 implements MigrationInterface {
  name = 'AddNullableToExperienceTable1746737360991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "departure_location" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "arrival_location" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "arrival_location" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "departure_location" SET NOT NULL`);
  }
}
