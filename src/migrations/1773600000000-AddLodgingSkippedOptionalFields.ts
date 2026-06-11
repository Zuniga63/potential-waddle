import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persists the wizard's "No tengo / No aplica" affordance server-side. Previously the
 * skipped state lived only in localStorage (`useSkippedFieldsStore`), which meant
 * the user lost the badge after logout, on a different device, or on session expiry.
 *
 * Stored as a `text[]` whose elements are the slug names matched by
 * `OptionalFieldWithSkip.fieldName` on the frontend — currently:
 *   ['website', 'facebook', 'instagram', 'openingHours',
 *    'spokenLanguages', 'arrivalReference', 'howToGetThere', 'places'].
 *
 * Why one array column instead of a sentinel value per field:
 *   - Field types are heterogeneous (`text`, `text[]`, M2M relation for places) so
 *     there's no uniform sentinel. Putting "N/A" in a URL column breaks Zod
 *     validation and pollutes downstream queries.
 *   - Three states matter: undecided / has-value / explicitly-skipped. Sentinel
 *     would collapse this to two.
 *   - Adding a new optional later is FE-only — no further migration needed.
 *
 * Default '{}' keeps every existing lodging row at "no skipped fields", which is
 * the correct baseline (no behavior change on rows that never saw the wizard).
 */
export class AddLodgingSkippedOptionalFields1773600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ADD COLUMN "skipped_optional_fields" text[] NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "skipped_optional_fields"`);
  }
}
