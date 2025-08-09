import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLocationAddGoogleMaps1754753711970 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop location column
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "location"`);

    // Check if google_maps_url exists before adding
    const result = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_event' AND column_name = 'google_maps_url'`,
    );
    if (result.length === 0) {
      await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "google_maps_url" text`);
    }

    // Check if end_date exists before adding
    const hasEndDate = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_event' AND column_name = 'end_date'`,
    );
    if (hasEndDate.length === 0) {
      await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "end_date" date`);
    }

    // Check if end_time exists before adding
    const hasEndTime = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_event' AND column_name = 'end_time'`,
    );
    if (hasEndTime.length === 0) {
      await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "end_time" time`);
    }

    // Check if date column exists before renaming
    const hasDate = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_event' AND column_name = 'date'`,
    );
    if (hasDate.length > 0) {
      await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "date" TO "start_date"`);
    }

    // Check if time column exists before renaming
    const hasTime = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_event' AND column_name = 'time'`,
    );
    if (hasTime.length > 0) {
      await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "time" TO "start_time"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if start_date column exists before renaming back
    const hasStartDate = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_event' AND column_name = 'start_date'`,
    );
    if (hasStartDate.length > 0) {
      await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "start_date" TO "date"`);
    }

    // Check if start_time column exists before renaming back
    const hasStartTime = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'public_event' AND column_name = 'start_time'`,
    );
    if (hasStartTime.length > 0) {
      await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "start_time" TO "time"`);
    }

    // Remove end_date and end_time columns
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "end_date"`);
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "end_time"`);

    // Remove google_maps_url column
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "google_maps_url"`);

    // Add back location column
    await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "location" geometry(Point, 4326)`);
  }
}
