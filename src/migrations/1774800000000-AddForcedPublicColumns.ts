import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a `forced_public` boolean column to every business entity table.
 *
 * When true, the super admin forces the entity to be publicly visible,
 * bypassing the normal gate (status='published' + is_public + active
 * subscription). Applied with an OR in each public query. Default false.
 *
 * Columns are NOT NULL with DEFAULT false — existing rows backfill to false.
 */
export class AddForcedPublicColumns1774800000000 implements MigrationInterface {
  private readonly tables = ['lodging', 'restaurant', 'commerce', 'transport', 'guide', 'place', 'experience'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "forced_public" boolean NOT NULL DEFAULT false`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "forced_public"`);
    }
  }
}
