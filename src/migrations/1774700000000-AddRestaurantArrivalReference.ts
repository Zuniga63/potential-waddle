import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an `arrival_reference` column to the `restaurant` table.
 * Holds a short reference point near the restaurant ("Punto de referencia"),
 * mirroring the lodging field of the same name. The restaurant onboarding
 * Location step already collected this value but had nowhere to persist it.
 *
 * Column is nullable — existing rows receive NULL (no backfill required).
 */
export class AddRestaurantArrivalReference1774700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" ADD COLUMN "arrival_reference" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "arrival_reference"`);
  }
}
