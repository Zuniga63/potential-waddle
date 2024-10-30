import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewerIdInTheHistory1730296707460 implements MigrationInterface {
  name = 'AddReviewerIdInTheHistory1730296707460';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "review_status_history" ADD "reviewer_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "review_status_history" ADD CONSTRAINT "FK_10299330d6acbd10496a98ce0e6" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "review_status_history" DROP CONSTRAINT "FK_10299330d6acbd10496a98ce0e6"`);
    await queryRunner.query(`ALTER TABLE "review_status_history" DROP COLUMN "reviewer_id"`);
  }
}
