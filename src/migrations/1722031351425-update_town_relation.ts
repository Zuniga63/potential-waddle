import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTownRelation1722031351425 implements MigrationInterface {
  name = 'UpdateTownRelation1722031351425';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" ADD "town_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "place" ADD CONSTRAINT "FK_579d731c4d4dc7f0dccc33c6aa9" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place" DROP CONSTRAINT "FK_579d731c4d4dc7f0dccc33c6aa9"`);
    await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "town_id"`);
  }
}
