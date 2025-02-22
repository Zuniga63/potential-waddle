import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTownFromGuide1740236148723 implements MigrationInterface {
  name = 'RemoveTownFromGuide1740236148723';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" DROP CONSTRAINT "FK_958aea0517e74c04c4ad4206be3"`);
    await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "town_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "guide" ADD "town_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "guide" ADD CONSTRAINT "FK_958aea0517e74c04c4ad4206be3" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
