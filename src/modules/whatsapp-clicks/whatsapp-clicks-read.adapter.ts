// Re-implements the legacy whatsapp_click reads over the generic events table (MIG-01).
// Legacy table NOT dropped — deprecated for the user's prod cutover.
//
// This adapter serves the three legacy READ endpoints
//   GET /whatsapp-clicks/analytics/detailed   -> getDetailedAnalytics
//   GET /whatsapp-clicks/admin/aggregated     -> getAggregatedAnalytics
//   GET /whatsapp-clicks/admin/dashboard-stats-> getDashboardStats
// from the generic `events` table (Phase 15) instead of the frozen `whatsapp_click`
// table, returning BYTE-IDENTICAL response shapes so the embedded
// AdminWhatsappAnalytics dashboard + every legacy consumer keep working with live
// data and zero frontend change.
//
// EVERY events query is filtered with `event_type = 'whatsapp_click' AND is_bot = false`
// (T-19-02: avoid counting non-whatsapp or bot rows).
//
// Column mapping legacy whatsapp_click -> events (see 19-01-PLAN <mapping>):
//   entity_id/type/slug, session_id, device_type   -> same-named events columns
//   browser_name   -> events.browser
//   os_name        -> events.os
//   country/city   -> events.country / events.city
//   time_on_page   -> events.time_on_page
//   page_type      -> events.properties->>'page_type'   (live + backfilled rows)
//   phone_number   -> events.properties->>'phone_number' (backfilled rows only; live rows null)
//   clicked_at     -> events.created_at
//
// is_repeat_click is ABSENT from events, so "repeat" is DERIVED with a window function:
// a whatsapp_click is a repeat iff a prior whatsapp_click exists for the same
// (session_id, entity_id) within 30 minutes —
//   LAG(created_at) OVER (PARTITION BY session_id, entity_id ORDER BY created_at)
// and is_repeat = prev IS NOT NULL AND created_at - prev <= interval '30 minutes'.
// "unique" clicks therefore = NOT is_repeat (parity with the legacy
// `COUNT(*) FILTER (WHERE is_repeat_click = false)`).
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Shared traffic-quality predicate, identical across every query (T-19-02).
const WC_FILTER = `event_type = 'whatsapp_click' AND is_bot = false`;

// Per-row "is_repeat_click" recomputed from events via a window function. Selected as a
// CTE so downstream aggregates can FILTER on it exactly like the legacy is_repeat_click.
// NULL session_id rows can never be a repeat (no prior in the same partition is matched
// because session_id is part of the partition and NULLs are distinct in the comparison).
const REPEAT_CTE = `
  SELECT
    e.*,
    (
      LAG(e.created_at) OVER (PARTITION BY e.session_id, e.entity_id ORDER BY e.created_at) IS NOT NULL
      AND e.created_at - LAG(e.created_at) OVER (PARTITION BY e.session_id, e.entity_id ORDER BY e.created_at) <= interval '30 minutes'
    ) AS is_repeat_click
  FROM events e
  WHERE ${WC_FILTER}
`;

@Injectable()
export class WhatsappClicksReadAdapter {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Get detailed analytics for entity dashboard.
   * Byte-identical to the legacy WhatsappClicksService.getDetailedAnalytics shape:
   *   { summary, breakdown, timeSeries }
   */
  async getDetailedAnalytics(entityId: string, entityType: string) {
    // Pull the raw whatsapp_click events for this entity, with the derived is_repeat_click.
    // Aggregation stays in JS to mirror the legacy method 1:1 (including ordering / slicing).
    const rows: {
      session_id: string | null;
      device_type: string | null;
      browser: string | null;
      os: string | null;
      page_type: string | null;
      country: string | null;
      city: string | null;
      time_on_page: number | null;
      phone_number: string | null;
      created_at: Date;
      is_repeat_click: boolean;
    }[] = await this.dataSource.query(
      `
      WITH wc AS (${REPEAT_CTE})
      SELECT
        session_id,
        device_type,
        browser,
        os,
        properties->>'page_type'     AS page_type,
        country,
        city,
        time_on_page,
        properties->>'phone_number'  AS phone_number,
        created_at,
        is_repeat_click
      FROM wc
      WHERE entity_id = $1::uuid AND entity_type = $2
      `,
      [entityId, entityType],
    );

    const total = rows.length;
    const uniqueClicks = rows.filter((c) => !c.is_repeat_click).length;
    const repeatClicks = rows.filter((c) => c.is_repeat_click).length;

    const tally = <T extends string | number>(
      pick: (row: (typeof rows)[number]) => T | null | undefined,
      fallback: T,
    ): Record<T, number> =>
      rows.reduce(
        (acc, row) => {
          const key = (pick(row) ?? fallback) as T;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        {} as Record<T, number>,
      );

    const deviceTypes = tally((c) => c.device_type, 'unknown');
    const browsers = tally((c) => c.browser, 'Unknown');
    const operatingSystems = tally((c) => c.os, 'Unknown');
    const pageTypes = tally((c) => c.page_type, 'Unknown');

    // Location breakdown — same precedence as legacy: "city, country" else "country".
    const locations = rows.reduce(
      (acc, click) => {
        if (click.city && click.country) {
          const location = `${click.city}, ${click.country}`;
          acc[location] = (acc[location] || 0) + 1;
        } else if (click.country) {
          acc[click.country] = (acc[click.country] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Clicks by date (last 30 days).
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const clicksByDate = rows
      .filter((c) => new Date(c.created_at) >= last30Days)
      .reduce(
        (acc, click) => {
          const date = new Date(click.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Clicks by hour (0-23).
    const clicksByHour = rows.reduce(
      (acc, click) => {
        const hour = new Date(click.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Average time on page.
    const timesOnPage = rows.map((c) => c.time_on_page).filter(Boolean) as number[];
    const avgTimeOnPage = timesOnPage.length > 0 ? timesOnPage.reduce((a, b) => a + b, 0) / timesOnPage.length : 0;

    // Top phone numbers clicked. events stores NO phone_number for live whatsapp_click
    // rows (PII, not allowlisted); only Plan-02 backfilled rows carry it in properties.
    // Skip null/undefined so live rows never produce an "undefined" bucket (T-19-04) —
    // emit {} when absent, never enumerate live PII.
    const topPhoneNumbers = rows.reduce(
      (acc, click) => {
        if (click.phone_number) {
          acc[click.phone_number] = (acc[click.phone_number] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary: {
        total,
        uniqueClicks,
        repeatClicks,
        repeatRate: total > 0 ? (repeatClicks / total) * 100 : 0,
        uniqueSessions: new Set(rows.map((c) => c.session_id).filter(Boolean)).size,
        avgTimeOnPage: Math.round(avgTimeOnPage),
      },
      breakdown: {
        deviceTypes,
        browsers,
        operatingSystems,
        pageTypes,
        locations: Object.entries(locations)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        topPhoneNumbers: Object.entries(topPhoneNumbers)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      },
      timeSeries: {
        clicksByDate: Object.entries(clicksByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        clicksByHour,
      },
    };
  }

  /**
   * Get aggregated analytics for admin panel (all entities).
   * Byte-identical to the legacy shape: { entities[], pagination, summary }.
   * The entity_name CASE + the per-type subselects are COPIED VERBATIM from the legacy
   * service; only the FROM table (events) and the WHERE filter (WC_FILTER) change.
   */
  async getAggregatedAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    entityType?: string;
    page: number;
    limit: number;
  }) {
    const { startDate, endDate, entityType, page, limit } = filters;
    const offset = (page - 1) * limit;

    // Build WHERE clause for date filters (legacy used wc.clicked_at -> e.created_at).
    let dateFilter = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      dateFilter += ` AND e.created_at >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateFilter += ` AND e.created_at <= $${paramIndex}`;
      params.push(endDateTime);
      paramIndex++;
    }

    if (entityType) {
      dateFilter += ` AND e.entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    const query = `
      WITH wc AS (
        SELECT e.entity_id, e.entity_type, e.entity_slug, e.created_at, e.is_repeat_click
        FROM (${REPEAT_CTE}) e
        WHERE 1=1 ${dateFilter}
      ),
      entity_clicks AS (
        SELECT
          wc.entity_id,
          wc.entity_type,
          wc.entity_slug,
          COUNT(*) as total_clicks,
          COUNT(*) FILTER (WHERE wc.is_repeat_click = false) as unique_clicks,
          MAX(wc.created_at) as last_click_at,
          CASE
            WHEN wc.entity_type = 'restaurant' THEN (SELECT name FROM restaurant WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'lodging' THEN (SELECT name FROM lodging WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'experience' THEN (SELECT title FROM experience WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'guide' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM guide WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'commerce' THEN (SELECT name FROM commerce WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'transport' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM transport WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'place' THEN (SELECT name FROM place WHERE id = wc.entity_id::uuid LIMIT 1)
            ELSE 'Unknown'
          END as entity_name
        FROM wc
        GROUP BY wc.entity_id, wc.entity_type, wc.entity_slug
      )
      SELECT
        entity_id,
        entity_type,
        entity_slug,
        entity_name,
        total_clicks,
        unique_clicks,
        last_click_at
      FROM entity_clicks
      WHERE entity_name IS NOT NULL
      ORDER BY total_clicks DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const entities = await this.dataSource.query(query, params);

    // Total count for pagination.
    const countQuery = `
      WITH wc AS (
        SELECT e.entity_id, e.entity_type
        FROM (${REPEAT_CTE}) e
        WHERE 1=1 ${dateFilter}
      ),
      entity_clicks AS (
        SELECT
          wc.entity_id,
          wc.entity_type,
          CASE
            WHEN wc.entity_type = 'restaurant' THEN (SELECT name FROM restaurant WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'lodging' THEN (SELECT name FROM lodging WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'experience' THEN (SELECT title FROM experience WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'guide' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM guide WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'commerce' THEN (SELECT name FROM commerce WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'transport' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM transport WHERE id = wc.entity_id::uuid LIMIT 1)
            WHEN wc.entity_type = 'place' THEN (SELECT name FROM place WHERE id = wc.entity_id::uuid LIMIT 1)
            ELSE 'Unknown'
          END as entity_name
        FROM wc
        GROUP BY wc.entity_id, wc.entity_type
      )
      SELECT COUNT(DISTINCT entity_id) as count
      FROM entity_clicks
      WHERE entity_name IS NOT NULL
    `;

    const countParams = params.slice(0, -2); // Remove limit and offset
    const [countResult] = await this.dataSource.query(countQuery, countParams);
    const total = parseInt(countResult?.count || '0', 10);

    // Summary stats.
    const summaryQuery = `
      WITH wc AS (
        SELECT e.entity_id, e.is_repeat_click
        FROM (${REPEAT_CTE}) e
        WHERE 1=1 ${dateFilter}
      )
      SELECT
        COUNT(DISTINCT wc.entity_id) as total_entities,
        COUNT(*) as total_clicks,
        COUNT(*) FILTER (WHERE wc.is_repeat_click = false) as total_unique_clicks
      FROM wc
    `;

    const [summary] = await this.dataSource.query(summaryQuery, countParams);

    return {
      entities: entities.map((e: any) => ({
        entityId: e.entity_id,
        entityType: e.entity_type,
        entitySlug: e.entity_slug,
        entityName: e.entity_name,
        totalClicks: parseInt(e.total_clicks, 10),
        uniqueClicks: parseInt(e.unique_clicks, 10),
        lastClickAt: e.last_click_at,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalEntities: parseInt(summary?.total_entities || '0', 10),
        totalClicks: parseInt(summary?.total_clicks || '0', 10),
        totalUniqueClicks: parseInt(summary?.total_unique_clicks || '0', 10),
      },
    };
  }

  /**
   * Get dashboard stats - clicks by day grouped by entity type.
   * Byte-identical to the legacy shape:
   *   { dates, entityTypes, chartData, totalsByEntityType, dataByEntityType }.
   * The town EXISTS subselects are COPIED VERBATIM from the legacy service; only the
   * FROM table (events) + the WHERE filter (WC_FILTER) change.
   */
  async getDashboardStats(days: number = 7, townId?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    let query: string;
    let params: any[];

    if (townId) {
      query = `
        SELECT
          DATE(wc.created_at) as date,
          wc.entity_type,
          COUNT(*) as total_clicks,
          COUNT(*) FILTER (WHERE wc.is_repeat_click = false) as unique_clicks
        FROM (${REPEAT_CTE}) wc
        WHERE wc.created_at >= $1
          AND (
            (wc.entity_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurant r WHERE r.id = wc.entity_id::uuid AND r.town_id = $2))
            OR (wc.entity_type = 'lodging' AND EXISTS (SELECT 1 FROM lodging l WHERE l.id = wc.entity_id::uuid AND l.town_id = $2))
            OR (wc.entity_type = 'place' AND EXISTS (SELECT 1 FROM place p WHERE p.id = wc.entity_id::uuid AND p.town_id = $2))
            OR (wc.entity_type = 'commerce' AND EXISTS (SELECT 1 FROM commerce c WHERE c.id = wc.entity_id::uuid AND c.town_id = $2))
            OR (wc.entity_type = 'transport' AND EXISTS (SELECT 1 FROM transport t WHERE t.id = wc.entity_id::uuid AND t.town_id = $2))
            OR (wc.entity_type = 'guide' AND EXISTS (SELECT 1 FROM guide_town gt WHERE gt.guide_id = wc.entity_id::uuid AND gt.town_id = $2))
          )
        GROUP BY DATE(wc.created_at), wc.entity_type
        ORDER BY date ASC, wc.entity_type
      `;
      params = [startDate, townId];
    } else {
      query = `
        SELECT
          DATE(wc.created_at) as date,
          wc.entity_type,
          COUNT(*) as total_clicks,
          COUNT(*) FILTER (WHERE wc.is_repeat_click = false) as unique_clicks
        FROM (${REPEAT_CTE}) wc
        WHERE wc.created_at >= $1
        GROUP BY DATE(wc.created_at), wc.entity_type
        ORDER BY date ASC, wc.entity_type
      `;
      params = [startDate];
    }

    const results = await this.dataSource.query(query, params);

    // Entity type labels in Spanish.
    const entityLabels: Record<string, string> = {
      restaurant: 'Restaurantes',
      lodging: 'Alojamientos',
      guide: 'Guías',
      commerce: 'Comercios',
      transport: 'Transporte',
      place: 'Lugares',
    };

    // Generate all dates in range.
    const dates: string[] = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (current <= today) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Initialize data structure.
    const entityTypes = ['restaurant', 'lodging', 'guide', 'commerce', 'transport', 'place'];
    const dataByEntityType: Record<string, { date: string; clicks: number; uniqueClicks: number }[]> = {};

    entityTypes.forEach((type) => {
      dataByEntityType[type] = dates.map((date) => ({
        date,
        clicks: 0,
        uniqueClicks: 0,
      }));
    });

    // Fill in the actual data.
    results.forEach((row: any) => {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);
      const entityType = row.entity_type;

      if (dataByEntityType[entityType]) {
        const dayData = dataByEntityType[entityType].find((d) => d.date === dateStr);
        if (dayData) {
          dayData.clicks = parseInt(row.total_clicks, 10);
          dayData.uniqueClicks = parseInt(row.unique_clicks, 10);
        }
      }
    });

    // Calculate totals by entity type.
    const totalsByEntityType: Record<string, { total: number; unique: number }> = {};
    entityTypes.forEach((type) => {
      totalsByEntityType[type] = {
        total: dataByEntityType[type].reduce((sum, d) => sum + d.clicks, 0),
        unique: dataByEntityType[type].reduce((sum, d) => sum + d.uniqueClicks, 0),
      };
    });

    // Format for chart.
    const chartData = dates.map((date) => {
      const dayData: Record<string, any> = { date };
      entityTypes.forEach((type) => {
        const found = dataByEntityType[type].find((d) => d.date === date);
        dayData[type] = found?.clicks || 0;
      });
      return dayData;
    });

    return {
      dates,
      entityTypes: entityTypes.map((type) => ({
        key: type,
        label: entityLabels[type] || type,
      })),
      chartData,
      totalsByEntityType,
      dataByEntityType,
    };
  }
}
