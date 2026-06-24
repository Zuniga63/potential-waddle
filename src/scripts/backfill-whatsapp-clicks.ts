/**
 * LOCAL-ONLY backfill + parity gate (MIG-02, Phase 19).
 *
 * Copies the historical `whatsapp_click` rows into the generic `events` table
 * (event_type='whatsapp_click', is_bot=false, is_internal=false) and then runs a
 * count-parity reconciliation that proves, per (entity_type, entity_id) AND in total,
 * that the legacy count equals the events count. The script exits non-zero if parity
 * is not EXACT — it never marks the migration "valid" on divergence.
 *
 * ── Safety (Phase 19 is irreversible) ──────────────────────────────────────────────
 *  • This script connects ONLY via connection-source (.env -> the LOCAL Binntu_DB on
 *    localhost:5435). `assertLocalDb()` refuses to run against a non-local DB_HOST
 *    unless `--allow-remote` is explicitly passed.
 *  • It performs NO DROP and NO DELETE of `whatsapp_click`. It does not push to git.
 *  • The PROD cutover — run this backfill against prod in a maintenance window, verify
 *    PARITY: PASS, and THEN drop the `whatsapp_click` table + remove the legacy
 *    endpoints — is the USER's explicit deferred step. It is NOT automated here.
 *
 * ── Idempotency (T-19-05) ──────────────────────────────────────────────────────────
 *  The INSERT REUSES the legacy `wc.id` as `events.id` and `wc.clicked_at` as
 *  `events.created_at`, and uses `ON CONFLICT (id, created_at) DO NOTHING` (the events
 *  composite PK). Running the backfill twice inserts each legacy row exactly once.
 *
 * ── Privacy (D-06/D-07, T-19-08) ───────────────────────────────────────────────────
 *  `latitude`, `longitude` and `ip_address` are NEVER copied. Only coarse country/city
 *  plus the allowlisted properties (phone_number, page_type, is_repeat_click) move over.
 *
 *  Run:  pnpm backfill:whatsapp
 */
import { connectionSource } from '../config/connection-source';

// --------------------------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------------------------
export interface EntityCount {
  entityType: string;
  entityId: string;
  count: number;
}

export interface ParityReport {
  perEntity: { entityType: string; entityId: string; legacy: number; events: number; match: boolean }[];
  total: { legacy: number; events: number };
  parityOk: boolean;
}

// Hosts that are considered LOCAL. An undefined/empty host means the default local
// docker bootstrap (connection-source falls back to a local DataSource).
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

// --------------------------------------------------------------------------------------------
// Safety guard (T-19-07)
// --------------------------------------------------------------------------------------------
/**
 * Refuse to run against a non-local DB. The PROD backfill is the user's deferred
 * cutover step; this script is LOCAL-ONLY validation. Pass `--allow-remote` to override
 * (intentionally explicit so it cannot happen by accident).
 */
export function assertLocalDb(dbHost: string | undefined, argv: string[]): void {
  if (argv.includes('--allow-remote')) return;
  const host = (dbHost ?? '').trim();
  if (host === '' || LOCAL_HOSTS.includes(host.toLowerCase())) return;
  throw new Error(
    `Refusing to run against a non-local DB (DB_HOST="${host}"): this script is LOCAL-ONLY ` +
      `validation per Phase 19 safety constraints. The prod backfill + the subsequent ` +
      `whatsapp_click DROP are the user's deferred cutover step. Pass --allow-remote to override.`,
  );
}

// --------------------------------------------------------------------------------------------
// Idempotent backfill SQL (T-19-05, T-19-08)
// --------------------------------------------------------------------------------------------
/**
 * The single idempotent INSERT. Maps whatsapp_click -> events per the 19-02 <mapping>:
 *  • REUSES wc.id as events.id and wc.clicked_at as events.created_at (natural idempotency key)
 *  • forces event_type='whatsapp_click', is_bot=false, is_internal=false
 *  • drops latitude/longitude/ip_address (privacy)
 *  • packs phone_number/page_type/is_repeat_click into properties jsonb
 *  • derives town_id via per-type EXISTS subselects (guide via guide_town); experience -> NULL
 *  • ON CONFLICT (id, created_at) DO NOTHING => re-running converges, never double-counts
 */
export function buildInsertSql(): string {
  return `
    INSERT INTO events (
      id, event_type, town_id, entity_type, entity_id, entity_slug,
      session_id, user_id, country, city, browser, os, device_type,
      is_bot, is_internal, referrer, time_on_page, properties, created_at
    )
    SELECT
      wc.id                                              AS id,
      'whatsapp_click'                                   AS event_type,
      -- town_id: derive from the entity's owner table; experience has no town -> NULL.
      CASE
        WHEN wc.entity_type = 'restaurant' THEN (SELECT r.town_id FROM restaurant r WHERE r.id = wc.entity_id::uuid LIMIT 1)
        WHEN wc.entity_type = 'lodging'    THEN (SELECT l.town_id FROM lodging l WHERE l.id = wc.entity_id::uuid LIMIT 1)
        WHEN wc.entity_type = 'place'      THEN (SELECT p.town_id FROM place p WHERE p.id = wc.entity_id::uuid LIMIT 1)
        WHEN wc.entity_type = 'commerce'   THEN (SELECT c.town_id FROM commerce c WHERE c.id = wc.entity_id::uuid LIMIT 1)
        WHEN wc.entity_type = 'transport'  THEN (SELECT t.town_id FROM transport t WHERE t.id = wc.entity_id::uuid LIMIT 1)
        WHEN wc.entity_type = 'guide'      THEN (SELECT gt.town_id FROM guide_town gt WHERE gt.guide_id = wc.entity_id::uuid LIMIT 1)
        ELSE NULL
      END                                                AS town_id,
      wc.entity_type                                     AS entity_type,
      wc.entity_id::uuid                                 AS entity_id,
      wc.entity_slug                                     AS entity_slug,
      wc.session_id                                      AS session_id,
      wc.user_id                                         AS user_id,
      wc.country                                         AS country,
      wc.city                                            AS city,
      wc.browser_name                                    AS browser,
      wc.os_name                                         AS os,
      wc.device_type                                     AS device_type,
      false                                              AS is_bot,
      false                                              AS is_internal,
      wc.referrer                                        AS referrer,
      wc.time_on_page                                    AS time_on_page,
      -- Allowlisted historical properties only (no lat/long/ip). NULL keys are stripped.
      jsonb_strip_nulls(
        jsonb_build_object(
          'phone_number',    wc.phone_number,
          'page_type',       wc.page_type,
          'is_repeat_click', wc.is_repeat_click
        )
      )                                                  AS properties,
      wc.clicked_at                                      AS created_at
    FROM whatsapp_click wc
    ON CONFLICT (id, created_at) DO NOTHING
  `;
}

// --------------------------------------------------------------------------------------------
// Per-entity count queries
// --------------------------------------------------------------------------------------------
const LEGACY_COUNT_SQL = `
  SELECT entity_type AS "entityType", entity_id AS "entityId", COUNT(*)::int AS count
  FROM whatsapp_click
  GROUP BY entity_type, entity_id
`;

const EVENTS_COUNT_SQL = `
  SELECT entity_type AS "entityType", entity_id::text AS "entityId", COUNT(*)::int AS count
  FROM events
  WHERE event_type = 'whatsapp_click'
  GROUP BY entity_type, entity_id
`;

// --------------------------------------------------------------------------------------------
// Parity gate (T-19-06)
// --------------------------------------------------------------------------------------------
/**
 * Compute the count-parity report. parityOk is true ONLY when every per-entity count
 * matches AND the totals match. An entity present on one side but missing on the other
 * is treated as a count of 0 on the missing side (=> mismatch).
 */
export function computeParity(legacyRows: EntityCount[], eventsRows: EntityCount[]): ParityReport {
  const key = (r: { entityType: string; entityId: string }) => `${r.entityType}::${r.entityId}`;
  const legacyMap = new Map(legacyRows.map((r) => [key(r), r.count]));
  const eventsMap = new Map(eventsRows.map((r) => [key(r), r.count]));

  const allKeys = new Set<string>([...legacyMap.keys(), ...eventsMap.keys()]);
  const perEntity = [...allKeys].map((k) => {
    const [entityType, entityId] = k.split('::');
    const legacy = legacyMap.get(k) ?? 0;
    const events = eventsMap.get(k) ?? 0;
    return { entityType, entityId, legacy, events, match: legacy === events };
  });

  const totalLegacy = legacyRows.reduce((s, r) => s + r.count, 0);
  const totalEvents = eventsRows.reduce((s, r) => s + r.count, 0);
  const parityOk = perEntity.every((r) => r.match) && totalLegacy === totalEvents;

  return {
    perEntity,
    total: { legacy: totalLegacy, events: totalEvents },
    parityOk,
  };
}

/** Render the parity report as a human-readable table + a final PARITY: PASS/FAIL line. */
export function printParityReport(report: ParityReport): void {
  // eslint-disable-next-line no-console
  const log = console.log;
  log('');
  log('═══════════════════════════════════════════════════════════════════════');
  log(' WhatsApp backfill — count-parity reconciliation (whatsapp_click vs events)');
  log('═══════════════════════════════════════════════════════════════════════');
  if (report.perEntity.length === 0) {
    log(' (no rows on either side — legacy table empty locally; 0 == 0)');
  } else {
    log(' entity_type        entity_id                             legacy  events  ok');
    log(' ─────────────────  ────────────────────────────────────  ──────  ──────  ──');
    for (const r of report.perEntity) {
      log(
        ` ${r.entityType.padEnd(17)}  ${r.entityId.padEnd(36)}  ${String(r.legacy).padStart(6)}  ${String(
          r.events,
        ).padStart(6)}  ${r.match ? '✓' : '✗'}`,
      );
    }
  }
  log(' ─────────────────────────────────────────────────────────────────────');
  log(` TOTAL  legacy=${report.total.legacy}  events=${report.total.events}`);
  log(`\n PARITY: ${report.parityOk ? 'PASS' : 'FAIL'}`);
  log('═══════════════════════════════════════════════════════════════════════\n');
}

// --------------------------------------------------------------------------------------------
// Runtime steps (live DB; not exercised by the unit spec)
// --------------------------------------------------------------------------------------------
/** Run the idempotent backfill against the (already-initialized) DataSource. */
export async function backfill(dataSource = connectionSource): Promise<void> {
  await dataSource.query(buildInsertSql());
}

/** Read the per-entity counts from both tables and compute the parity report. */
export async function reconcile(dataSource = connectionSource): Promise<ParityReport> {
  const [legacyRows, eventsRows] = await Promise.all([
    dataSource.query(LEGACY_COUNT_SQL) as Promise<EntityCount[]>,
    dataSource.query(EVENTS_COUNT_SQL) as Promise<EntityCount[]>,
  ]);
  return computeParity(legacyRows, eventsRows);
}

async function main(): Promise<void> {
  assertLocalDb(process.env.DB_HOST, process.argv.slice(2));

  // eslint-disable-next-line no-console
  console.log(`[backfill] connecting to LOCAL DB host="${process.env.DB_HOST ?? '(default local)'}"`);
  await connectionSource.initialize();

  try {
    // eslint-disable-next-line no-console
    console.log('[backfill] copying whatsapp_click -> events (idempotent ON CONFLICT DO NOTHING)…');
    await backfill();

    // eslint-disable-next-line no-console
    console.log('[backfill] reconciling counts…');
    const report = await reconcile();
    printParityReport(report);

    await connectionSource.destroy();
    process.exit(report.parityOk ? 0 : 1);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[backfill] failed:', err);
    await connectionSource.destroy().catch(() => undefined);
    process.exit(1);
  }
}

// Only run when invoked directly (not when imported by the unit spec).
if (require.main === module) {
  void main();
}
