import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Generic first-party analytics event (Phase 15, v1.4).
 *
 * Hybrid schema (D-02): typed indexed columns for the fields the dashboards pivot
 * on + a `properties` jsonb for everything else (no schema migration per new event).
 *
 * Composite PK `(id, created_at)` (Pitfall 1): the table is `PARTITION BY RANGE
 * (created_at)`, and Postgres requires the partition key in every PK — so this
 * entity declares both columns as primary, NOT a single generated PK (which would
 * emit a single-column PK and break partitioning).
 *
 * Privacy (D-06/D-07): coarse geo only (country/department/city), no precise
 * coordinates and no address column for the client. Geo is derived server-side;
 * the address is used only in-memory and discarded.
 */
@Entity({ name: 'events' })
export class Event {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuid_generate_v4()' })
  id: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: string;

  @Column({ name: 'town_id', type: 'uuid', nullable: true })
  townId: string | null;

  @Column({ name: 'entity_type', type: 'varchar', nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'entity_slug', type: 'varchar', nullable: true })
  entitySlug: string | null;

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  // * --- Coarse geo, derived server-side from IP (D-06). No lat/long, no raw IP. ---
  @Column({ name: 'country', type: 'varchar', nullable: true })
  country: string | null;

  @Column({ name: 'department', type: 'varchar', nullable: true })
  department: string | null;

  @Column({ name: 'city', type: 'varchar', nullable: true })
  city: string | null;

  // * --- Device, parsed server-side from the user agent ---
  @Column({ name: 'browser', type: 'varchar', nullable: true })
  browser: string | null;

  @Column({ name: 'os', type: 'varchar', nullable: true })
  os: string | null;

  @Column({ name: 'device_type', type: 'varchar', nullable: true })
  deviceType: string | null;

  // * --- Traffic-quality flags (D-10): excluded from dashboard metrics ---
  @Column({ name: 'is_bot', type: 'boolean', default: false })
  isBot: boolean;

  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal: boolean;

  // * --- Page context ---
  @Column({ name: 'referrer', type: 'varchar', nullable: true })
  referrer: string | null;

  @Column({ name: 'page_path', type: 'varchar', nullable: true })
  pagePath: string | null;

  @Column({ name: 'time_on_page', type: 'integer', nullable: true })
  timeOnPage: number | null;

  // * --- Free-form, allowlist-sanitized per event_type (D-02) ---
  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, unknown> | null;

  @PrimaryColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
