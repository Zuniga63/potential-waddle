import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 15 (v1.4 analytics): generic first-party events pipeline.
 *
 * Creates the partitioned `events` table per D-02 (hybrid schema: typed indexed
 * columns + `properties` jsonb) and D-08 (monthly RANGE partitioning for cheap
 * 12-month retention purge later — no purge happens here).
 *
 * Partition gotcha (Pitfall 1): in a partitioned table the partition key MUST be
 * part of every unique/primary key, so the PK is composite `(id, created_at)` —
 * NOT a single-column `id`. The TypeORM entity mirrors this with two @PrimaryColumn.
 *
 * Privacy (D-06/D-07): NO latitude/longitude, NO raw IP column ever. Geo is derived
 * coarse server-side from the IP and the IP is discarded.
 */
export class AddEventsTable1719200000000 implements MigrationInterface {
  name = 'AddEventsTable1719200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Partitioned parent table. PK MUST include the partition key `created_at`.
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_type" varchar NOT NULL,
        "town_id" uuid NULL,
        "entity_type" varchar NULL,
        "entity_id" uuid NULL,
        "entity_slug" varchar NULL,
        "session_id" varchar NULL,
        "user_id" uuid NULL,
        "country" varchar NULL,
        "department" varchar NULL,
        "city" varchar NULL,
        "browser" varchar NULL,
        "os" varchar NULL,
        "device_type" varchar NULL,
        "is_bot" boolean NOT NULL DEFAULT false,
        "is_internal" boolean NOT NULL DEFAULT false,
        "referrer" varchar NULL,
        "page_path" varchar NULL,
        "time_on_page" integer NULL,
        "properties" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id", "created_at")
      ) PARTITION BY RANGE ("created_at");
    `);

    // 2. Initial monthly partitions: 2026-06 .. 2026-12 (7 partitions). Auto-create
    //    of future months is a deferred refinement per D-08 (volume won't fill these).
    await queryRunner.query(
      `CREATE TABLE "events_2026_06" PARTITION OF "events" FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');`,
    );
    await queryRunner.query(
      `CREATE TABLE "events_2026_07" PARTITION OF "events" FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');`,
    );
    await queryRunner.query(
      `CREATE TABLE "events_2026_08" PARTITION OF "events" FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');`,
    );
    await queryRunner.query(
      `CREATE TABLE "events_2026_09" PARTITION OF "events" FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');`,
    );
    await queryRunner.query(
      `CREATE TABLE "events_2026_10" PARTITION OF "events" FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');`,
    );
    await queryRunner.query(
      `CREATE TABLE "events_2026_11" PARTITION OF "events" FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');`,
    );
    await queryRunner.query(
      `CREATE TABLE "events_2026_12" PARTITION OF "events" FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');`,
    );

    // 3. Indexes on the parent propagate to every partition (D-02 index strategy).
    //    Per-entity reads (business dashboard, Phase 17):
    await queryRunner.query(
      `CREATE INDEX "idx_events_entity" ON "events" ("entity_type","entity_id","event_type","created_at" DESC) WHERE "entity_id" IS NOT NULL;`,
    );
    //    Per-tenant reads (platform dashboard, Phase 18):
    await queryRunner.query(
      `CREATE INDEX "idx_events_town" ON "events" ("town_id","event_type","created_at" DESC);`,
    );
    //    Same-session funnel joins (Phase 17):
    await queryRunner.query(`CREATE INDEX "idx_events_session" ON "events" ("session_id","entity_id","event_type");`);
    //    Cheap time-range / retention scans (low write cost):
    await queryRunner.query(`CREATE INDEX "idx_events_created_brin" ON "events" USING BRIN ("created_at");`);
    // NOTE: deliberately NO GIN index over `properties` jsonb (ARCHITECTURE.md Anti-Pattern 1).
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dropping the parent cascades all partitions + indexes.
    await queryRunner.query(`DROP TABLE "events";`);
  }
}
