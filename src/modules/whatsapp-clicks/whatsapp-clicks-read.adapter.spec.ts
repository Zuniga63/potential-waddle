// MIG-01 parity: the events-backed WhatsappClicksReadAdapter must emit BYTE-IDENTICAL
// response shapes to the legacy whatsapp_click reads (T-19-01), and EVERY events query
// must carry `event_type = 'whatsapp_click' AND is_bot = false` (T-19-02).
//
// DataSource.query is mocked to return canned rows; we assert the OUTPUT object's exact
// key set + computed values, and grep the issued SQL for the required filter. Mocking
// mirrors the events.* spec style (a `{ query: jest.fn() }` DataSource).
import { WhatsappClicksReadAdapter } from './whatsapp-clicks-read.adapter';

describe('WhatsappClicksReadAdapter (MIG-01 — events-backed parity)', () => {
  let adapter: WhatsappClicksReadAdapter;
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
    adapter = new WhatsappClicksReadAdapter(dataSource as any);
  });

  // Every issued SQL string must filter to whatsapp_click + non-bot (T-19-02).
  const assertFilterOnEveryQuery = () => {
    expect(dataSource.query).toHaveBeenCalled();
    for (const call of dataSource.query.mock.calls) {
      const sql = String(call[0]);
      expect(sql).toContain("event_type = 'whatsapp_click'");
      expect(sql).toContain('is_bot = false');
    }
  };

  // ----------------------------------------------------------------------------------------------
  // getDetailedAnalytics
  // ----------------------------------------------------------------------------------------------
  describe('getDetailedAnalytics', () => {
    it('returns the exact { summary, breakdown, timeSeries } shape and the filter is present', async () => {
      const now = new Date();
      dataSource.query.mockResolvedValueOnce([
        {
          session_id: 's1',
          device_type: 'mobile',
          browser: 'Chrome',
          os: 'Android',
          page_type: 'detail',
          country: 'Colombia',
          city: 'Medellín',
          time_on_page: 30,
          phone_number: null, // live row: no PII
          created_at: now,
          is_repeat_click: false,
        },
        {
          session_id: 's1',
          device_type: 'mobile',
          browser: 'Chrome',
          os: 'Android',
          page_type: 'detail',
          country: 'Colombia',
          city: 'Medellín',
          time_on_page: 10,
          phone_number: null,
          created_at: now,
          is_repeat_click: true,
        },
      ]);

      const res = await adapter.getDetailedAnalytics('e-1', 'restaurant');

      // top-level keys
      expect(Object.keys(res).sort()).toEqual(['breakdown', 'summary', 'timeSeries']);
      // summary keys
      expect(Object.keys(res.summary).sort()).toEqual(
        ['avgTimeOnPage', 'repeatClicks', 'repeatRate', 'total', 'uniqueClicks', 'uniqueSessions'].sort(),
      );
      // breakdown keys
      expect(Object.keys(res.breakdown).sort()).toEqual(
        ['browsers', 'deviceTypes', 'locations', 'operatingSystems', 'pageTypes', 'topPhoneNumbers'].sort(),
      );
      // timeSeries keys
      expect(Object.keys(res.timeSeries).sort()).toEqual(['clicksByDate', 'clicksByHour'].sort());

      // computed values
      expect(res.summary.total).toBe(2);
      expect(res.summary.uniqueClicks).toBe(1);
      expect(res.summary.repeatClicks).toBe(1);
      expect(res.summary.repeatRate).toBe(50);
      expect(res.summary.uniqueSessions).toBe(1);
      expect(res.summary.avgTimeOnPage).toBe(20);
      expect(res.breakdown.deviceTypes).toEqual({ mobile: 2 });
      expect(res.breakdown.locations).toEqual({ 'Medellín, Colombia': 2 });

      assertFilterOnEveryQuery();
    });

    it('emits topPhoneNumbers = {} when phone_number is absent (T-19-04, no live PII)', async () => {
      dataSource.query.mockResolvedValueOnce([
        {
          session_id: 's1',
          device_type: 'desktop',
          browser: 'Firefox',
          os: 'Windows',
          page_type: null,
          country: null,
          city: null,
          time_on_page: null,
          phone_number: null,
          created_at: new Date(),
          is_repeat_click: false,
        },
      ]);

      const res = await adapter.getDetailedAnalytics('e-1', 'lodging');
      expect(res.breakdown.topPhoneNumbers).toEqual({});
      // null pageType falls back to 'Unknown' bucket (legacy parity)
      expect(res.breakdown.pageTypes).toEqual({ Unknown: 1 });
    });

    it('zero state: total 0, repeatRate 0, empty breakdown maps', async () => {
      dataSource.query.mockResolvedValueOnce([]);
      const res = await adapter.getDetailedAnalytics('e-1', 'guide');
      expect(res.summary.total).toBe(0);
      expect(res.summary.repeatRate).toBe(0);
      expect(res.breakdown.deviceTypes).toEqual({});
      expect(res.breakdown.topPhoneNumbers).toEqual({});
    });
  });

  // ----------------------------------------------------------------------------------------------
  // getAggregatedAnalytics — shape + pagination math
  // ----------------------------------------------------------------------------------------------
  describe('getAggregatedAnalytics', () => {
    it('returns { entities, pagination, summary } with identical keys + pagination math', async () => {
      dataSource.query
        // entities query
        .mockResolvedValueOnce([
          {
            entity_id: 'e-1',
            entity_type: 'restaurant',
            entity_slug: 'r-uno',
            entity_name: 'Resto Uno',
            total_clicks: '10',
            unique_clicks: '7',
            last_click_at: new Date('2026-06-20T10:00:00Z'),
          },
        ])
        // count query
        .mockResolvedValueOnce([{ count: '25' }])
        // summary query
        .mockResolvedValueOnce([{ total_entities: '3', total_clicks: '40', total_unique_clicks: '30' }]);

      const res = await adapter.getAggregatedAnalytics({ page: 2, limit: 10 });

      expect(Object.keys(res).sort()).toEqual(['entities', 'pagination', 'summary']);
      expect(Object.keys(res.entities[0]).sort()).toEqual(
        ['entityId', 'entityName', 'entitySlug', 'entityType', 'lastClickAt', 'totalClicks', 'uniqueClicks'].sort(),
      );
      expect(res.entities[0].totalClicks).toBe(10);
      expect(res.entities[0].uniqueClicks).toBe(7);

      // pagination math: totalPages = ceil(25 / 10) = 3
      expect(res.pagination).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });

      expect(res.summary).toEqual({ totalEntities: 3, totalClicks: 40, totalUniqueClicks: 30 });

      assertFilterOnEveryQuery();
    });

    it('handles empty result sets (total 0, totalPages 0)', async () => {
      dataSource.query
        .mockResolvedValueOnce([]) // entities
        .mockResolvedValueOnce([{ count: '0' }]) // count
        .mockResolvedValueOnce([{ total_entities: '0', total_clicks: '0', total_unique_clicks: '0' }]); // summary

      const res = await adapter.getAggregatedAnalytics({ page: 1, limit: 20 });
      expect(res.entities).toEqual([]);
      expect(res.pagination).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
      expect(res.summary).toEqual({ totalEntities: 0, totalClicks: 0, totalUniqueClicks: 0 });
    });
  });

  // ----------------------------------------------------------------------------------------------
  // getDashboardStats — 6 fixed types, zero-fill, Spanish labels
  // ----------------------------------------------------------------------------------------------
  describe('getDashboardStats', () => {
    it('returns the exact shape with 6 entity types, Spanish labels, and zero-filled dates', async () => {
      // no rows -> everything zero-filled
      dataSource.query.mockResolvedValueOnce([]);

      const res = await adapter.getDashboardStats(7);

      expect(Object.keys(res).sort()).toEqual(
        ['chartData', 'dataByEntityType', 'dates', 'entityTypes', 'totalsByEntityType'].sort(),
      );

      // 6 fixed entity types with Spanish labels
      expect(res.entityTypes).toEqual([
        { key: 'restaurant', label: 'Restaurantes' },
        { key: 'lodging', label: 'Alojamientos' },
        { key: 'guide', label: 'Guías' },
        { key: 'commerce', label: 'Comercios' },
        { key: 'transport', label: 'Transporte' },
        { key: 'place', label: 'Lugares' },
      ]);

      // dates span days+1 (inclusive of today)
      expect(res.dates.length).toBe(8);

      // every type present + zero-filled across the date range
      for (const type of ['restaurant', 'lodging', 'guide', 'commerce', 'transport', 'place']) {
        expect(res.dataByEntityType[type]).toHaveLength(res.dates.length);
        expect(res.totalsByEntityType[type]).toEqual({ total: 0, unique: 0 });
      }

      // chartData one row per date, each carrying all 6 keys + date
      expect(res.chartData).toHaveLength(res.dates.length);
      expect(Object.keys(res.chartData[0]).sort()).toEqual(
        ['commerce', 'date', 'guide', 'lodging', 'place', 'restaurant', 'transport'].sort(),
      );

      assertFilterOnEveryQuery();
    });

    it('aggregates rows into the right entity-type bucket', async () => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      dataSource.query.mockResolvedValueOnce([
        { date, entity_type: 'restaurant', total_clicks: '5', unique_clicks: '4' },
      ]);

      const res = await adapter.getDashboardStats(7);
      expect(res.totalsByEntityType.restaurant).toEqual({ total: 5, unique: 4 });
      const row = res.chartData.find((r: any) => r.date === dateStr);
      expect(row?.restaurant).toBe(5);
    });

    it('applies the town EXISTS subselects when townId is provided', async () => {
      dataSource.query.mockResolvedValueOnce([]);
      await adapter.getDashboardStats(7, 'town-123');
      const sql = String(dataSource.query.mock.calls[0][0]);
      expect(sql).toContain('guide_town');
      expect(sql).toContain('town_id = $2');
      // params include the townId
      expect(dataSource.query.mock.calls[0][1]).toContain('town-123');
      assertFilterOnEveryQuery();
    });
  });
});
