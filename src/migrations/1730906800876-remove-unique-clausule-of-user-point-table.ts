import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueClausuleOfUserPointTable1730906800876 implements MigrationInterface {
  name = 'RemoveUniqueClausuleOfUserPointTable1730906800876';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_point" DROP CONSTRAINT "UQ_2dfca9bb730649809f3e6cf652a"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_point" ADD CONSTRAINT "UQ_2dfca9bb730649809f3e6cf652a" UNIQUE ("user_id", "review_id", "place_id", "town_id")`,
    );
  }
}
