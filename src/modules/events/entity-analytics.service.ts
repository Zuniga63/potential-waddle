// BIZ-01..05: per-entity analytics powering the 4-card dashboard + charts + funnel.
//
// Reads the `events` table (Phase 15). EVERY count excludes bots/internal traffic
// (is_bot = false AND is_internal = false — Pitfall 2 / D-02). All values are bound
// parameters ($1..$n); entityType reaches here only after the controller's @IsEnum gate
// and the resolver whitelist, so no user string is interpolated into SQL (T-17-05).
//
// Conversion (D-03 / Pitfall 10): SAME-SESSION attribution — a session "converted" iff it has
// at least one page_view AND at least one whatsapp_click for THIS entity within the window.
// conversionRate = 100 * converted_sessions / uniqueVisitors, clamped to [0,100]. Cross-session
// attribution is intentionally out of scope for the MVP.
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface EntityAnalyticsSummary {
  views: number;
  uniqueVisitors: number;
  whatsappContacts: number;
  conversionRate: number; // percent, 0..100, 1 decimal
}

export interface EntityAnalyticsDeltas {
  // signed % change vs the immediately-preceding equal-length window; null when the prior
  // value was 0 (avoids Infinity / meaningless ratios).
  viewsPct: number | null;
  uniqueVisitorsPct: number | null;
  whatsappContactsPct: number | null;
  conversionRatePct: number | null;
}

export interface EntityAnalyticsTrendPoint {
  date: string; // YYYY-MM-DD
  views: number;
  contacts: number;
}

export interface EntityAnalyticsCity {
  city: string; // 'Desconocida' for null
  visitors: number;
}

export interface EntityAnalyticsChannels {
  whatsapp: number;
  phone: number;
  web: number;
  map: number;
  share: number;
}

export interface EntityAnalyticsResponse {
  summary: EntityAnalyticsSummary;
  deltas: EntityAnalyticsDeltas;
  trend: EntityAnalyticsTrendPoint[];
  byCity: EntityAnalyticsCity[];
  byChannel: EntityAnalyticsChannels;
  range: { from: string; to: string };
}

interface AggregateRow {
  views: string;
  unique_visitors: string;
  whatsapp_contacts: string;
  converted_sessions: string;
}

// Shared traffic-quality + scope predicate (kept identical across every query for consistency).
const BASE_WHERE =
  'entity_type = $1 AND entity_id = $2 AND is_bot = false AND is_internal = false AND created_at >= $3 AND created_at <= $4';

@Injectable()
export class EntityAnalyticsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getEntityAnalytics(params: {
    entityType: string;
    entityId: string;
    from?: string;
    to?: string;
    townId: string | null;
  }): Promise<EntityAnalyticsResponse> {
    const { entityType, entityId } = params;

    // --- Resolve the window. `to` defaults to now; `from` defaults to 30 days before `to`. ---
    const to = params.to ? endOfDay(params.to) : new Date();
    const from = params.from ? startOfDay(params.from) : new Date(to.getTime() - 30 * DAY_MS);
    // Previous equal-length window immediately before [from, to].
    const windowMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - windowMs);

    // 1) Current-window aggregate
    const [currentRow] = (await this.dataSource.query(this.aggregateSql(), [
      entityType,
      entityId,
      from,
      to,
    ])) as AggregateRow[];

    // 2) Previous-window aggregate (for deltas)
    const [prevRow] = (await this.dataSource.query(this.aggregateSql(), [
      entityType,
      entityId,
      prevFrom,
      prevTo,
    ])) as AggregateRow[];

    // 3) Daily trend (views + contacts per day), zero-filled across [from, to]
    const trendRows: { date: Date; views: string; contacts: string }[] = await this.dataSource.query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) FILTER (WHERE event_type = 'page_view')      AS views,
              COUNT(*) FILTER (WHERE event_type = 'whatsapp_click') AS contacts
         FROM events
        WHERE ${BASE_WHERE}
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
      [entityType, entityId, from, to],
    );

    // 4) Visitors by city (coarse), top 10
    const cityRows: { city: string | null; visitors: string }[] = await this.dataSource.query(
      `SELECT city,
              COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS visitors
         FROM events
        WHERE ${BASE_WHERE}
        GROUP BY city
        ORDER BY visitors DESC
        LIMIT 10`,
      [entityType, entityId, from, to],
    );

    // 5) Interactions by channel
    const [channelRow] = (await this.dataSource.query(
      `SELECT COUNT(*) FILTER (WHERE event_type = 'whatsapp_click') AS whatsapp,
              COUNT(*) FILTER (WHERE event_type = 'phone_click')    AS phone,
              COUNT(*) FILTER (WHERE event_type = 'web_click')      AS web,
              COUNT(*) FILTER (WHERE event_type = 'map_click')      AS map,
              COUNT(*) FILTER (WHERE event_type = 'share')          AS share
         FROM events
        WHERE ${BASE_WHERE}`,
      [entityType, entityId, from, to],
    )) as { whatsapp: string; phone: string; web: string; map: string; share: string }[];

    const summary = this.buildSummary(currentRow);
    const prevSummary = this.buildSummary(prevRow);

    return {
      summary,
      deltas: {
        viewsPct: signedDelta(summary.views, prevSummary.views),
        uniqueVisitorsPct: signedDelta(summary.uniqueVisitors, prevSummary.uniqueVisitors),
        whatsappContactsPct: signedDelta(summary.whatsappContacts, prevSummary.whatsappContacts),
        conversionRatePct: signedDelta(summary.conversionRate, prevSummary.conversionRate),
      },
      trend: zeroFillTrend(trendRows, from, to),
      byCity: cityRows.map((r) => ({ city: r.city ?? 'Desconocida', visitors: toInt(r.visitors) })),
      byChannel: {
        whatsapp: toInt(channelRow?.whatsapp),
        phone: toInt(channelRow?.phone),
        web: toInt(channelRow?.web),
        map: toInt(channelRow?.map),
        share: toInt(channelRow?.share),
      },
      range: { from: ymd(from), to: ymd(to) },
    };
  }

  /**
   * Single aggregate over the window:
   *  - views               = page_view count
   *  - unique_visitors     = distinct page_view sessions
   *  - whatsapp_contacts   = whatsapp_click count
   *  - converted_sessions  = distinct sessions that have BOTH a page_view AND a whatsapp_click
   *                          for THIS entity in the window (same-session attribution, Pitfall 10).
   *                          Bounded by unique_visitors => conversion can never exceed 100%.
   */
  private aggregateSql(): string {
    return `
      WITH scoped AS (
        SELECT session_id, event_type
          FROM events
         WHERE ${BASE_WHERE}
      ),
      sessions AS (
        SELECT session_id,
               BOOL_OR(event_type = 'page_view')      AS viewed,
               BOOL_OR(event_type = 'whatsapp_click') AS contacted
          FROM scoped
         WHERE session_id IS NOT NULL
         GROUP BY session_id
      )
      SELECT
        (SELECT COUNT(*) FROM scoped WHERE event_type = 'page_view')      AS views,
        (SELECT COUNT(*) FROM sessions WHERE viewed)                       AS unique_visitors,
        (SELECT COUNT(*) FROM scoped WHERE event_type = 'whatsapp_click')  AS whatsapp_contacts,
        (SELECT COUNT(*) FROM sessions WHERE viewed AND contacted)         AS converted_sessions
    `;
  }

  private buildSummary(row: AggregateRow | undefined): EntityAnalyticsSummary {
    const views = toInt(row?.views);
    const uniqueVisitors = toInt(row?.unique_visitors);
    const whatsappContacts = toInt(row?.whatsapp_contacts);
    const converted = toInt(row?.converted_sessions);

    // Clamp to [0,100]; converted is already bounded by uniqueVisitors at the SQL level, but
    // the explicit clamp + NULLIF guard documents the invariant and survives any edge case.
    const rawRate = uniqueVisitors > 0 ? (100 * converted) / uniqueVisitors : 0;
    const conversionRate = Math.round(Math.min(Math.max(rawRate, 0), 100) * 10) / 10;

    return { views, uniqueVisitors, whatsappContacts, conversionRate };
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

/** Signed % change of `current` vs `prev`; null when prev is 0 (avoids Infinity). */
function signedDelta(current: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((current - prev) / prev) * 100 * 10) / 10;
}

// NOTE: events.created_at is stored in UTC (timestamptz) and `ymd` formats via toISOString
// (UTC). Day boundaries MUST therefore be computed in UTC too — using local setHours on a
// negative-offset server (e.g. America/Bogota, UTC-5) rolled `endOfDay('2026-06-24')` back to
// 2026-06-24T04:59Z, silently excluding the rest of the UTC day's events from the dashboard.
function startOfDay(iso: string): Date {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDay(iso: string): Date {
  const d = new Date(iso);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function ymd(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Zero-fill the daily trend across [from, to] so every day in range is present. */
function zeroFillTrend(
  rows: { date: Date | string; views: string; contacts: string }[],
  from: Date,
  to: Date,
): EntityAnalyticsTrendPoint[] {
  const byDate = new Map<string, { views: number; contacts: number }>();
  for (const r of rows) {
    const key = r.date instanceof Date ? ymd(r.date) : ymd(new Date(r.date));
    byDate.set(key, { views: toInt(r.views), contacts: toInt(r.contacts) });
  }

  const out: EntityAnalyticsTrendPoint[] = [];
  const cursor = startOfDay(ymd(from));
  const last = startOfDay(ymd(to));
  while (cursor <= last) {
    const key = ymd(cursor);
    const hit = byDate.get(key);
    out.push({ date: key, views: hit?.views ?? 0, contacts: hit?.contacts ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
