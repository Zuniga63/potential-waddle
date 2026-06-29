// PLAT-01..03: platform aggregates powering the /admin/analytics dashboard (Plan 03).
//
// Reads the `events` table (Phase 15). EVERY count excludes bots/internal traffic
// (is_bot = false AND is_internal = false — Pitfall 2 / D-03). All values are bound parameters;
// town ids/slugs, dates and search terms are NEVER interpolated into SQL (T-18-03). event_type /
// entity_type filters are literal constants in the SQL, never user strings.
//
// Tenant scope (T-18-01): `townIds` arrives ALREADY resolved by resolvePlatformScope (the IDOR
// gate runs in the controller BEFORE this service). `null` => super-admin all-towns (no town
// predicate). A non-null array scopes via `town_id = ANY($n)`. A super-admin's single requested
// slug is resolved slug->id here before querying (a uuid is used directly).
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface PlatformSearchRow {
  query: string;
  count: number;
}

export interface PlatformTrafficPoint {
  date: string; // YYYY-MM-DD
  townId: string | null;
  townSlug: string | null;
  views: number;
  visitors: number;
}

export interface PlatformTopEntity {
  entityType: string;
  entityId: string;
  entitySlug: string | null;
  entityName: string | null;
  views: number;
  contacts: number;
}

export interface PlatformFunnelRow {
  townId: string | null;
  entityType: string;
  views: number;
  contacts: number;
  rate: number; // percent, 0..100, 1 decimal (page_view -> whatsapp_click)
}

export interface PlatformAnalyticsResponse {
  range: { from: string; to: string };
  topSearches: PlatformSearchRow[];
  zeroResultSearches: PlatformSearchRow[];
  traffic: PlatformTrafficPoint[];
  topEntities: PlatformTopEntity[];
  funnel: PlatformFunnelRow[];
}

// A standard v4 UUID shape — used to decide whether a super-admin's `town` value needs slug->id
// resolution or can be used directly as an id.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PlatformAnalyticsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getPlatformAnalytics(params: {
    from?: string;
    to?: string;
    townIds: string[] | null;
    // true ONLY when a super-admin passed a single town value that may be a slug (resolveSlug from
    // the scope). Forced town-admin scopes pass false -> their concrete town ids are used as-is.
    resolveSlug?: boolean;
  }): Promise<PlatformAnalyticsResponse> {
    // --- Resolve the window. `to` defaults to now; `from` defaults to 30 days before `to`. ---
    const to = params.to ? endOfDay(params.to) : new Date();
    const from = params.from ? startOfDay(params.from) : new Date(to.getTime() - 30 * DAY_MS);

    // --- Resolve the town scope to concrete ids (super-admin slug -> id; null = all towns). ---
    const townIds = await this.resolveTownIds(params.townIds, params.resolveSlug ?? false);

    // Shared traffic-quality + window predicate. The town predicate is appended only when scoped.
    // $1 = from, $2 = to, $3 = town ids array (when present).
    const base = 'is_bot = false AND is_internal = false AND created_at >= $1 AND created_at <= $2';
    const townClause = townIds ? ' AND town_id = ANY($3)' : '';
    const baseParams: unknown[] = townIds ? [from, to, townIds] : [from, to];

    // 1) topSearches — most frequent non-blank search terms.
    const topSearchRows: { query: string; count: string }[] = await this.dataSource.query(
      `SELECT lower(trim(properties->>'query')) AS query, COUNT(*) AS count
         FROM events
        WHERE event_type = 'search_performed' AND ${base}${townClause}
          AND coalesce(trim(properties->>'query'), '') <> ''
        GROUP BY lower(trim(properties->>'query'))
        ORDER BY count DESC
        LIMIT 10`,
      baseParams,
    );

    // 2) zeroResultSearches — searches that returned no results (unmet demand, highest value).
    const zeroResultRows: { query: string; count: string }[] = await this.dataSource.query(
      `SELECT lower(trim(properties->>'query')) AS query, COUNT(*) AS count
         FROM events
        WHERE event_type = 'search_performed' AND ${base}${townClause}
          AND coalesce(trim(properties->>'query'), '') <> ''
          AND (properties->>'result_count') ~ '^[0-9]+$'
          AND (properties->>'result_count')::int = 0
        GROUP BY lower(trim(properties->>'query'))
        ORDER BY count DESC
        LIMIT 10`,
      baseParams,
    );

    // 3) traffic — views + distinct visitors per day per town (with town slug for the dashboard).
    const trafficRows: {
      date: Date | string;
      town_id: string | null;
      town_slug: string | null;
      views: string;
      visitors: string;
    }[] = await this.dataSource.query(
      `SELECT DATE(e.created_at) AS date,
              e.town_id AS town_id,
              t.slug AS town_slug,
              COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS views,
              COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'page_view') AS visitors
         FROM events e
         LEFT JOIN town t ON t.id = e.town_id
        WHERE ${prefix(base, 'e')}${prefixTownClause(townClause)}
        GROUP BY DATE(e.created_at), e.town_id, t.slug
        ORDER BY date ASC, town_slug ASC NULLS LAST`,
      baseParams,
    );

    // 4) topEntities — most viewed/contacted entities (page_view + whatsapp_click counts).
    const topEntityRows: {
      entity_type: string;
      entity_id: string;
      entity_slug: string | null;
      entity_name: string | null;
      views: string;
      contacts: string;
    }[] = await this.dataSource.query(
      `SELECT entity_type, entity_id, entity_slug,
              COUNT(*) FILTER (WHERE event_type = 'page_view')      AS views,
              COUNT(*) FILTER (WHERE event_type = 'whatsapp_click') AS contacts,
              CASE
                WHEN entity_type = 'restaurant' THEN (SELECT name FROM restaurant WHERE id = entity_id::uuid LIMIT 1)
                WHEN entity_type = 'lodging' THEN (SELECT name FROM lodging WHERE id = entity_id::uuid LIMIT 1)
                WHEN entity_type = 'experience' THEN (SELECT title FROM experience WHERE id = entity_id::uuid LIMIT 1)
                WHEN entity_type = 'guide' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM guide WHERE id = entity_id::uuid LIMIT 1)
                WHEN entity_type = 'commerce' THEN (SELECT name FROM commerce WHERE id = entity_id::uuid LIMIT 1)
                WHEN entity_type = 'transport' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM transport WHERE id = entity_id::uuid LIMIT 1)
                WHEN entity_type = 'place' THEN (SELECT name FROM place WHERE id = entity_id::uuid LIMIT 1)
              END AS entity_name
         FROM events
        WHERE entity_id IS NOT NULL AND entity_type IS NOT NULL AND ${base}${townClause}
        GROUP BY entity_type, entity_id, entity_slug
        ORDER BY views DESC
        LIMIT 20`,
      baseParams,
    );

    // 5) funnel — page_view -> whatsapp_click per town/entity_type with conversion rate.
    const funnelRows: { town_id: string | null; entity_type: string; views: string; contacts: string }[] =
      await this.dataSource.query(
        `SELECT town_id, entity_type,
                COUNT(*) FILTER (WHERE event_type = 'page_view')      AS views,
                COUNT(*) FILTER (WHERE event_type = 'whatsapp_click') AS contacts
           FROM events
          WHERE entity_type IS NOT NULL AND ${base}${townClause}
          GROUP BY town_id, entity_type
          ORDER BY views DESC`,
        baseParams,
      );

    return {
      range: { from: ymd(from), to: ymd(to) },
      topSearches: topSearchRows.map((r) => ({ query: r.query, count: toInt(r.count) })),
      zeroResultSearches: zeroResultRows.map((r) => ({ query: r.query, count: toInt(r.count) })),
      traffic: trafficRows.map((r) => ({
        date: r.date instanceof Date ? ymd(r.date) : ymd(new Date(r.date)),
        townId: r.town_id ?? null,
        townSlug: r.town_slug ?? null,
        views: toInt(r.views),
        visitors: toInt(r.visitors),
      })),
      topEntities: topEntityRows.map((r) => ({
        entityType: r.entity_type,
        entityId: r.entity_id,
        entitySlug: r.entity_slug ?? null,
        entityName: r.entity_name ?? null,
        views: toInt(r.views),
        contacts: toInt(r.contacts),
      })),
      funnel: funnelRows.map((r) => {
        const views = toInt(r.views);
        const contacts = toInt(r.contacts);
        const raw = views > 0 ? (100 * contacts) / views : 0;
        const rate = Math.round(Math.min(Math.max(raw, 0), 100) * 10) / 10;
        return { townId: r.town_id ?? null, entityType: r.entity_type, views, contacts, rate };
      }),
    };
  }

  /**
   * Resolve the requested scope into concrete town ids.
   *  - null            -> null (super-admin all-towns, no filter).
   *  - [uuid, ...]     -> used directly (already ids — town-admin forced towns or super uuid).
   *  - [slug] (single) -> resolved via `SELECT id FROM town WHERE slug = $1` (super-admin filter).
   * The raw value is ALWAYS a bound parameter; never interpolated.
   */
  private async resolveTownIds(townIds: string[] | null, resolveSlug: boolean): Promise<string[] | null> {
    if (!townIds || townIds.length === 0) return null;

    // Only a super-admin's single requested town (resolveSlug) may be a slug. Forced town-admin
    // scopes are concrete ids and are used as-is — never reinterpreted as a slug.
    if (resolveSlug && townIds.length === 1 && !UUID_RE.test(townIds[0])) {
      const rows: { id: string }[] = await this.dataSource.query('SELECT id FROM town WHERE slug = $1', [townIds[0]]);
      const id = rows?.[0]?.id;
      // No match -> scope to an impossible set (no rows) rather than widening to all towns.
      return id ? [id] : ['00000000-0000-0000-0000-000000000000'];
    }

    return townIds;
  }
}

// ------------------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------------------
const DAY_MS = 24 * 60 * 60 * 1000;

function toInt(v: unknown): number {
  const n = parseInt(String(v ?? '0'), 10);
  return Number.isFinite(n) ? n : 0;
}

// Window bounds are computed in UTC so they round-trip with `ymd` (which formats via toISOString,
// i.e. UTC) regardless of the server timezone — `from: '2026-06-01'` stays '2026-06-01'.
function startOfDay(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

function endOfDay(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T23:59:59.999Z`);
}

function ymd(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Prefix bare column refs in the shared predicate with a table alias (for the JOINed traffic query). */
function prefix(base: string, alias: string): string {
  return base
    .replace(/is_bot/g, `${alias}.is_bot`)
    .replace(/is_internal/g, `${alias}.is_internal`)
    .replace(/created_at/g, `${alias}.created_at`);
}

/** Prefix the town predicate's column with the events alias for the JOINed traffic query. */
function prefixTownClause(clause: string): string {
  return clause.replace(/town_id/g, 'e.town_id');
}
