// BIZ-08 / T-17-01..05: ownership (IDOR gate) + analytics math (conversion clamp,
// bot/internal exclusion, deltas vs prior window, empty-range zeros).
//
// The resolver is the IDOR gate — `assertCanRead` MUST run BEFORE any analytics query
// (wired in the controller, see events.controller.spec.ts). Here we unit-test the
// resolver against a mocked DataSource and the service against a mocked DataSource.
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntityOwnershipResolver } from './entity-ownership.resolver';
import { EntityAnalyticsService } from './entity-analytics.service';

// ------------------------------------------------------------------------------------------------
// EntityOwnershipResolver — the IDOR gate
// ------------------------------------------------------------------------------------------------
describe('EntityOwnershipResolver (ownership / IDOR — T-17-01/02)', () => {
  let resolver: EntityOwnershipResolver;
  let dataSource: { query: jest.Mock };

  const OWNER = { id: 'user-owner', isSuperUser: false, towns: [] } as any;
  const OTHER = { id: 'user-other', isSuperUser: false, towns: [] } as any;
  const SUPER = { id: 'user-super', isSuperUser: true, towns: [] } as any;
  const TOWN_ADMIN = { id: 'user-ta', isSuperUser: false, towns: [{ id: 'town-1' }] } as any;

  beforeEach(() => {
    dataSource = { query: jest.fn() };
    resolver = new EntityOwnershipResolver(dataSource as any);
  });

  it('resolves (no throw) for the owner of a lodging', async () => {
    dataSource.query.mockResolvedValueOnce([{ user_id: 'user-owner', town_id: 'town-1' }]);
    await expect(resolver.assertCanRead('lodging', 'lodging-1', OWNER)).resolves.toEqual({ townId: 'town-1' });
  });

  it('throws ForbiddenException for a non-owner / non-admin (cross-owner IDOR -> 403)', async () => {
    dataSource.query.mockResolvedValueOnce([{ user_id: 'user-owner', town_id: 'town-1' }]);
    await expect(resolver.assertCanRead('lodging', 'lodging-1', OTHER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resolves for a super-admin on any entity', async () => {
    dataSource.query.mockResolvedValueOnce([{ user_id: 'someone-else', town_id: 'town-9' }]);
    await expect(resolver.assertCanRead('lodging', 'lodging-1', SUPER)).resolves.toEqual({ townId: 'town-9' });
  });

  it('resolves for a town-admin of the entity town; throws for a different town', async () => {
    dataSource.query.mockResolvedValueOnce([{ user_id: 'user-owner', town_id: 'town-1' }]);
    await expect(resolver.assertCanRead('restaurant', 'r-1', TOWN_ADMIN)).resolves.toEqual({ townId: 'town-1' });

    dataSource.query.mockResolvedValueOnce([{ user_id: 'user-owner', town_id: 'town-2' }]);
    await expect(resolver.assertCanRead('restaurant', 'r-2', TOWN_ADMIN)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('place (no owner): only town-admin of its town or super resolves; a plain user throws', async () => {
    dataSource.query.mockResolvedValueOnce([{ user_id: null, town_id: 'town-1' }]);
    await expect(resolver.assertCanRead('place', 'p-1', TOWN_ADMIN)).resolves.toEqual({ townId: 'town-1' });

    dataSource.query.mockResolvedValueOnce([{ user_id: null, town_id: 'town-1' }]);
    await expect(resolver.assertCanRead('place', 'p-1', OTHER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('experience: owner is the experience guide owner (experience.guide.user_id)', async () => {
    dataSource.query.mockResolvedValueOnce([{ user_id: 'user-owner', town_id: 'town-1' }]);
    await expect(resolver.assertCanRead('experience', 'e-1', OWNER)).resolves.toEqual({ townId: 'town-1' });
  });

  it('guide: town comes from guide_town; town-admin of a guide town resolves', async () => {
    // first query: guide row (user_id only, no town_id column)
    dataSource.query.mockResolvedValueOnce([{ user_id: 'user-owner', town_id: null }]);
    // second query: guide_town rows
    dataSource.query.mockResolvedValueOnce([{ town_id: 'town-1' }, { town_id: 'town-3' }]);
    await expect(resolver.assertCanRead('guide', 'g-1', TOWN_ADMIN)).resolves.toEqual({ townId: 'town-1' });
  });

  it('throws NotFoundException when the entity row does not exist', async () => {
    dataSource.query.mockResolvedValueOnce([]);
    await expect(resolver.assertCanRead('lodging', 'missing', OWNER)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an unknown entityType (whitelist guard — no SQL injection)', async () => {
    await expect(resolver.assertCanRead('robots; DROP TABLE', 'x', OWNER)).rejects.toBeInstanceOf(NotFoundException);
    expect(dataSource.query).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------------------------------------
// EntityAnalyticsService — summary, conversion clamp, bot exclusion, deltas, empty range
// ------------------------------------------------------------------------------------------------
describe('EntityAnalyticsService (BIZ-01..05 — math)', () => {
  let service: EntityAnalyticsService;
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
    service = new EntityAnalyticsService(dataSource as any);
  });

  // The service runs several queries; we drive them by call order. The service implementation
  // must call, in order: (1) current-window aggregate, (2) previous-window aggregate,
  // (3) daily trend, (4) byCity, (5) byChannel. Each test stubs that sequence.
  const stub = (opts: {
    current: any;
    previous?: any;
    trend?: any[];
    byCity?: any[];
    byChannel?: any;
  }) => {
    dataSource.query
      .mockResolvedValueOnce([opts.current])
      .mockResolvedValueOnce([opts.previous ?? { views: '0', unique_visitors: '0', whatsapp_contacts: '0', converted_sessions: '0' }])
      .mockResolvedValueOnce(opts.trend ?? [])
      .mockResolvedValueOnce(opts.byCity ?? [])
      .mockResolvedValueOnce([opts.byChannel ?? { whatsapp: '0', phone: '0', web: '0', map: '0', share: '0' }]);
  };

  it('computes summary and clamps conversion <= 100 (same-session converted/unique)', async () => {
    // 2 unique visitors, 1 of them also sent a whatsapp -> 50%
    stub({ current: { views: '3', unique_visitors: '2', whatsapp_contacts: '1', converted_sessions: '1' } });
    const res = await service.getEntityAnalytics({ entityType: 'lodging', entityId: 'l-1', townId: 'town-1' });
    expect(res.summary.views).toBe(3);
    expect(res.summary.uniqueVisitors).toBe(2);
    expect(res.summary.whatsappContacts).toBe(1);
    expect(res.summary.conversionRate).toBe(50);
  });

  it('never lets conversion exceed 100% even with more contacts than visitors', async () => {
    // 1 visitor, 5 whatsapp contacts, but converted_sessions capped at unique -> <= 100
    stub({ current: { views: '1', unique_visitors: '1', whatsapp_contacts: '5', converted_sessions: '1' } });
    const res = await service.getEntityAnalytics({ entityType: 'lodging', entityId: 'l-1', townId: 'town-1' });
    expect(res.summary.conversionRate).toBeLessThanOrEqual(100);
    expect(res.summary.conversionRate).toBe(100);
  });

  it('empty range -> all zeros, conversion 0, deltas null (no NaN, no divide-by-zero)', async () => {
    stub({ current: { views: '0', unique_visitors: '0', whatsapp_contacts: '0', converted_sessions: '0' } });
    const res = await service.getEntityAnalytics({ entityType: 'lodging', entityId: 'l-1', townId: 'town-1' });
    expect(res.summary).toEqual({ views: 0, uniqueVisitors: 0, whatsappContacts: 0, conversionRate: 0 });
    expect(res.deltas.viewsPct).toBeNull();
    expect(res.deltas.uniqueVisitorsPct).toBeNull();
    expect(res.deltas.whatsappContactsPct).toBeNull();
    expect(Number.isNaN(res.summary.conversionRate)).toBe(false);
  });

  it('computes signed delta percentages vs the prior equal window', async () => {
    stub({
      current: { views: '120', unique_visitors: '60', whatsapp_contacts: '12', converted_sessions: '6' },
      previous: { views: '100', unique_visitors: '50', whatsapp_contacts: '10', converted_sessions: '5' },
    });
    const res = await service.getEntityAnalytics({ entityType: 'lodging', entityId: 'l-1', townId: 'town-1' });
    expect(res.deltas.viewsPct).toBe(20); // (120-100)/100 * 100
    expect(res.deltas.uniqueVisitorsPct).toBe(20);
    expect(res.deltas.whatsappContactsPct).toBe(20);
  });

  it('passes is_bot=false AND is_internal=false into every aggregate query (bot exclusion)', async () => {
    stub({ current: { views: '0', unique_visitors: '0', whatsapp_contacts: '0', converted_sessions: '0' } });
    await service.getEntityAnalytics({ entityType: 'lodging', entityId: 'l-1', townId: 'town-1' });
    for (const call of dataSource.query.mock.calls) {
      const sql = String(call[0]);
      expect(sql).toMatch(/is_bot\s*=\s*false/i);
      expect(sql).toMatch(/is_internal\s*=\s*false/i);
    }
  });

  it('returns trend, byCity and byChannel in the documented shape', async () => {
    stub({
      current: { views: '5', unique_visitors: '3', whatsapp_contacts: '1', converted_sessions: '1' },
      trend: [{ date: new Date('2026-06-20T00:00:00Z'), views: '5', contacts: '1' }],
      byCity: [{ city: 'Medellín', visitors: '3' }, { city: null, visitors: '1' }],
      byChannel: { whatsapp: '1', phone: '2', web: '3', map: '4', share: '5' },
    });
    const res = await service.getEntityAnalytics({
      entityType: 'lodging',
      entityId: 'l-1',
      from: '2026-06-20',
      to: '2026-06-20',
      townId: 'town-1',
    });
    expect(res.trend.length).toBeGreaterThan(0);
    expect(res.trend[0]).toHaveProperty('date');
    expect(res.trend[0]).toHaveProperty('views');
    expect(res.trend[0]).toHaveProperty('contacts');
    expect(res.byCity[0]).toEqual({ city: 'Medellín', visitors: 3 });
    expect(res.byCity.find((c) => c.city === 'Desconocida')).toBeDefined();
    expect(res.byChannel).toEqual({ whatsapp: 1, phone: 2, web: 3, map: 4, share: 5 });
  });
});
