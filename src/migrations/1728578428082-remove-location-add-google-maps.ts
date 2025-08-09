import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLocationAddGoogleMaps1728578428082 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop location column
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "location"`);
    
    // Add google_maps_url column
    await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "google_maps_url" text`);

    // Add end_date and end_time columns
    await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "end_date" date`);
    await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "end_time" time`);

    // Rename existing date and time columns to start_date and start_time
    await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "date" TO "start_date"`);
    await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "time" TO "start_time"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename back start_date and start_time columns to date and time
    await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "start_date" TO "date"`);
    await queryRunner.query(`ALTER TABLE "public_event" RENAME COLUMN "start_time" TO "time"`);

    // Remove end_date and end_time columns
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "end_date"`);
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "end_time"`);

    // Remove google_maps_url column
    await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN IF EXISTS "google_maps_url"`);
    
    // Add back location column
    await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "location" geometry(Point, 4326)`);
  }
} 