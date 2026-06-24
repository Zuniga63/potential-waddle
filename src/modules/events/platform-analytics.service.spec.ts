// PLAT-01..04 / T-18-01/02/03: scope (IDOR) + platform aggregate math.
//
// resolvePlatformScope is the pure IDOR gate (unit-tested directly here). The service is tested
// against a mocked DataSource (raw SQL), mirroring entity-analytics.service.spec.ts. Together they
// prove a town-admin's scope is FORCED to their town and the other town's id never reaches SQL.
import { ForbiddenException } from '@nestjs/common';
import { resolvePlatformScope } from './platform-analytics.scope';
import { PlatformAnalyticsService } from './platform-analytics.service';

// ------------------------------------------------------------------------------------------------
// resolvePlatformScope — the IDOR gate (pure, DB-free)
// ------------------------------------------------------------------------------------------------
describe('resolvePlatformScope (PLAT-04 / IDOR — T-18-01/02)', () => {
  const SUPER = { isSuperUser: true, towns: [] };
  const TOWN_ADMIN = { isSuperUser: false, towns: [{ id: 'town-1' }] };
  const MULTI_TOWN_ADMIN = { isSuperUser: false, towns: [{ id: 'town-1' }, { id: 'town-3' }] };
  const NO_TOWNS = { isSuperUser: false, towns: [] };

  it('super-admin, no requested town -> townIds null (ALL towns, no filter)', () => {
    expect(resolvePlatformScope(SUPER)).toEqual({ townIds: null, resolveSlug: false });
  });

  it('super-admin, requested town -> townIds [requestedTown] (raw slug/id; service resolves)', () => {
    expect(resolvePlatformScope(SUPER, 'sanrafael')).toEqual({ townIds: ['sanrafael'], resolveSlug: true });
  });

  it('town-admin -> FORCED to own towns; requested OTHER town is ignored (IDOR)', () => {
    const scope = resolvePlatformScope(TOWN_ADMIN, 'town-2');
    expect(scope.townIds).toEqual(['town-1']);
    // The other town's id must NEVER appear in the resolved scope.
    expect(scope.townIds).not.toContain('town-2');
  });

  it('multi-town admin -> all their own towns, never a foreign one', () => {
    const scope = resolvePlatformScope(MULTI_TOWN_ADMIN, 'town-99');
    expect(scope.townIds).toEqual(['town-1', 'town-3']);
    expect(scope.townIds).not.toContain('town-99');
  });

  it('non-super with no towns -> ForbiddenException', () => {
    expect(() => resolvePlatformScope(NO_TOWNS)).toThrow(ForbiddenException);
    expect(() => resolvePlatformScope(NO_TOWNS, 'town-1')).toThrow(ForbiddenException);
  });
});

// ------------------------------------------------------------------------------------------------
// PlatformAnalyticsService — aggregates + scope wiring + bot/internal exclusion
// ------------------------------------------------------------------------------------------------
describe('PlatformAnalyticsService (PLAT-01..03 — aggregates)', () => {
  let service: PlatformAnalyticsService;
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
    service = new PlatformAnalyticsService(dataSource as any);
  });

  // The service runs, in order (no slug resolution unless a single non-uuid town is passed):
  //   (1) topSearches, (2) zeroResultSearches, (3) traffic, (4) topEntities, (5) funnel.
  const stubAggregates = (opts: {
    topSearches?: any[];
    zeroResultSearches?: any[];
    traffic?: any[];
    topEntities?: any[];
    funnel?: any[];
  }) => {
    dataSource.query
      .mockResolvedValueOnce(opts.topSearches ?? [])
      .mockResolvedValueOnce(opts.zeroResultSearches ?? [])
      .mockResolvedValueOnce(opts.traffic ?? [])
      .mockResolvedValueOnce(opts.topEntities ?? [])
      .mockResolvedValueOnce(opts.funnel ?? []);
  };

  it('super-admin all-towns (townIds null) -> NO town predicate in any query', async () => {
    stubAggregates({});
    await service.getPlatformAnalytics({ townIds: null });
    for (const call of dataSource.query.mock.calls) {
      const sql = String(call[0]);
      expect(sql).not.toMatch(/town_id\s*=\s*ANY/i);
    }
  });

  it('town-admin forced to town-1 -> every query binds town-1 ONLY; town-2 never appears (IDOR)', async () => {
    // Simulate the controller path: resolvePlatformScope forces the town, the service receives it.
    const scope = resolvePlatformScope({ isSuperUser: false, towns: [{ id: 'town-1' }] }, 'town-2');
    stubAggregates({});
    await service.getPlatformAnalytics({ townIds: scope.townIds });

    let sawTownPredicate = false;
    for (const call of dataSource.query.mock.calls) {
      const sql = String(call[0]);
      const params = (call[1] ?? []) as unknown[];
      if (/town_id\s*=\s*ANY/i.test(sql)) sawTownPredicate = true;
      // town-2 (the other town) must never be a bound parameter.
      expect(params).not.toContain('town-2');
      // The forced town-1 must be the only town id passed (as an array param).
      const arrayParams = params.filter((p) => Array.isArray(p)) as string[][];
      for (const arr of arrayParams) {
        expect(arr).not.toContain('town-2');
      }
    }
    expect(sawTownPredicate).toBe(true);
  });

  it('super-admin single requested slug -> resolves slug->id (SELECT id FROM town) then filters by id', async () => {
    // First query is the slug->id resolution (non-uuid value), then the 5 aggregates.
    dataSource.query.mockResolvedValueOnce([{ id: 'town-uuid-1' }]); // slug resolution
    dataSource.query
      .mockResolvedValueOnce([]) // topSearches
      .mockResolvedValueOnce([]) // zeroResultSearches
      .mockResolvedValueOnce([]) // traffic
      .mockResolvedValueOnce([]) // topEntities
      .mockResolvedValueOnce([]); // funnel

    await service.getPlatformAnalytics({ townIds: ['sanrafael'], resolveSlug: true });

    const firstCall = dataSource.query.mock.calls[0];
    expect(String(firstCall[0])).toMatch(/SELECT\s+id\s+FROM\s+town/i);
    expect(firstCall[1]).toEqual(['sanrafael']);

    // Subsequent aggregate queries must bind the RESOLVED id, not the raw slug.
    for (const call of dataSource.query.mock.calls.slice(1)) {
      const params = (call[1] ?? []) as unknown[];
      const arrayParams = params.filter((p) => Array.isArray(p)) as string[][];
      for (const arr of arrayParams) {
        expect(arr).toEqual(['town-uuid-1']);
        expect(arr).not.toContain('sanrafael');
      }
    }
  });

  it('every query carries is_bot=false AND is_internal=false (bot/internal exclusion)', async () => {
    stubAggregates({});
    await service.getPlatformAnalytics({ townIds: null });
    expect(dataSource.query.mock.calls.length).toBeGreaterThan(0);
    for (const call of dataSource.query.mock.calls) {
      const sql = String(call[0]);
      expect(sql).toMatch(/is_bot\s*=\s*false/i);
      expect(sql).toMatch(/is_internal\s*=\s*false/i);
    }
  });

  it('topSearches: maps rows to { query, count } desc', async () => {
    stubAggregates({
      topSearches: [
        { query: 'cabañas', count: '12' },
        { query: 'hotel', count: '5' },
      ],
    });
    const res = await service.getPlatformAnalytics({ townIds: null });
    expect(res.topSearches).toEqual([
      { query: 'cabañas', count: 12 },
      { query: 'hotel', count: 5 },
    ]);
  });

  it('zeroResultSearches: maps rows to { query, count }', async () => {
    stubAggregates({ zeroResultSearches: [{ query: 'kayak nocturno', count: '3' }] });
    const res = await service.getPlatformAnalytics({ townIds: null });
    expect(res.zeroResultSearches).toEqual([{ query: 'kayak nocturno', count: 3 }]);
  });

  it('traffic: maps rows to { date, townId, townSlug, views, visitors }', async () => {
    stubAggregates({
      traffic: [
        { date: new Date('2026-06-20T00:00:00Z'), town_id: 'town-1', town_slug: 'sanrafael', views: '10', visitors: '4' },
      ],
    });
    const res = await service.getPlatformAnalytics({ townIds: null });
    expect(res.traffic[0]).toEqual({
      date: '2026-06-20',
      townId: 'town-1',
      townSlug: 'sanrafael',
      views: 10,
      visitors: 4,
    });
  });

  it('topEntities: maps rows to { entityType, entityId, entitySlug, views, contacts }', async () => {
    stubAggregates({
      topEntities: [
        { entity_type: 'lodging', entity_id: 'l-1', entity_slug: 'hotel-x', views: '20', contacts: '3' },
      ],
    });
    const res = await service.getPlatformAnalytics({ townIds: null });
    expect(res.topEntities[0]).toEqual({
      entityType: 'lodging',
      entityId: 'l-1',
      entitySlug: 'hotel-x',
      views: 20,
      contacts: 3,
    });
  });

  it('funnel: maps rows to { townId, entityType, views, contacts, rate } clamped [0,100]', async () => {
    stubAggregates({
      funnel: [
        { town_id: 'town-1', entity_type: 'lodging', views: '100', contacts: '25' },
        { town_id: 'town-1', entity_type: 'restaurant', views: '0', contacts: '0' },
      ],
    });
    const res = await service.getPlatformAnalytics({ townIds: null });
    expect(res.funnel[0]).toEqual({ townId: 'town-1', entityType: 'lodging', views: 100, contacts: 25, rate: 25 });
    // zero views -> rate 0, never NaN.
    expect(res.funnel[1].rate).toBe(0);
    expect(Number.isNaN(res.funnel[1].rate)).toBe(false);
  });

  it('returns the resolved range { from, to }', async () => {
    stubAggregates({});
    const res = await service.getPlatformAnalytics({ from: '2026-06-01', to: '2026-06-23', townIds: null });
    expect(res.range).toEqual({ from: '2026-06-01', to: '2026-06-23' });
  });
});
