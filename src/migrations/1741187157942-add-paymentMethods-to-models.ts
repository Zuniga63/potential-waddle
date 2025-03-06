import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentMethodsToModels1741187157942 implements MigrationInterface {
  name = 'AddPaymentMethodsToModels1741187157942';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transport" ADD "payment_methods" text array`);
    await queryRunner.query(`ALTER TABLE "restaurant" ADD "payment_methods" text array`);
    await queryRunner.query(`ALTER TABLE "experience" ADD "payment_methods" text array`);
    await queryRunner.query(`ALTER TABLE "lodging" ADD "payment_methods" text array`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "payment_methods"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "payment_methods"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "payment_methods"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "payment_methods"`);
  }
}
