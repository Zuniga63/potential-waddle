// EVENT-01/02/08: EventsService.ingest builds a row and persists it fire-and-forget.
//   - town_id comes from the server-derived townId arg, NEVER from the client dto (T-15-01).
//   - a repository error is logged via Logger.error and NOT rethrown (non-blocking, EVENT-08).
//   - no `ipAddress`/`ip` field is ever passed to repository.create (D-06).
import { EventsService } from './events.service';

describe('EventsService.ingest (EVENT-01/02/08)', () => {
  let service: EventsService;
  let repo: { create: jest.Mock; save: jest.Mock };
  let userRepo: { findOne: jest.Mock };
  let geoIp: { lookup: jest.Mock };
  let botFilter: { isBot: jest.Mock };
  let deviceParser: { parse: jest.Mock };

  beforeEach(() => {
    repo = { create: jest.fn((row) => row), save: jest.fn().mockResolvedValue(undefined) };
    userRepo = { findOne: jest.fn() };
    geoIp = { lookup: jest.fn().mockReturnValue({ country: null, department: null, city: null }) };
    botFilter = { isBot: jest.fn().mockReturnValue(false) };
    deviceParser = { parse: jest.fn().mockReturnValue({ browser: null, os: null, deviceType: null }) };

    service = new EventsService(repo as any, userRepo as any, geoIp as any, botFilter as any, deviceParser as any);
  });

  it('takes town_id from the passed townId arg, never from the dto body (T-15-01)', async () => {
    await service.ingest({
      // a malicious dto carrying a town field must be ignored
      dto: { eventType: 'page_view', townId: 'forged-town' } as any,
      ip: '1.2.3.4',
      townId: 'server-derived-town',
      userAgent: 'Chrome',
      user: null,
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ townId: 'server-derived-town' }));
  });

  it('never passes an ipAddress/ip field to repository.create (D-06)', async () => {
    await service.ingest({
      dto: { eventType: 'page_view' } as any,
      ip: '1.2.3.4',
      townId: null,
      userAgent: 'Chrome',
      user: null,
    });
    const created = repo.create.mock.calls[0][0];
    expect(created).not.toHaveProperty('ipAddress');
    expect(created).not.toHaveProperty('ip');
    // the IP WAS used in-memory for the geo lookup, but never persisted
    expect(geoIp.lookup).toHaveBeenCalledWith('1.2.3.4');
  });

  it('sets user_id + is_internal when a user is present, anonymous otherwise', async () => {
    await service.ingest({
      dto: { eventType: 'page_view' } as any,
      ip: null,
      townId: null,
      userAgent: 'Chrome',
      user: { id: 'user-1' },
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', isInternal: true }));

    repo.create.mockClear();
    await service.ingest({
      dto: { eventType: 'page_view' } as any,
      ip: null,
      townId: null,
      userAgent: 'Chrome',
      user: null,
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: null, isInternal: false }));
  });

  it('flags is_bot from the bot filter', async () => {
    botFilter.isBot.mockReturnValueOnce(true);
    await service.ingest({
      dto: { eventType: 'page_view' } as any,
      ip: null,
      townId: null,
      userAgent: 'Googlebot',
      user: null,
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ isBot: true }));
  });

  it('drops an entity-scoped event when no town resolved server-side (D-03 guard)', async () => {
    const warnSpy = jest.fn();
    (service as any).logger = { warn: warnSpy, error: jest.fn() };
    await service.ingest({
      dto: { eventType: 'page_view', entityType: 'lodging', entityId: 'abc' } as any,
      ip: null,
      townId: null, // unresolved tenant on an entity event → must NOT persist
      userAgent: 'Chrome',
      user: null,
    });
    expect(repo.save).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('persists an apex/platform event with null town (D-03 — no entity)', async () => {
    await service.ingest({
      dto: { eventType: 'search_performed' } as any, // no entity → platform event, null town OK
      ip: null,
      townId: null,
      userAgent: 'Chrome',
      user: null,
    });
    expect(repo.save).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ townId: null, entityId: null }));
  });

  it('logs a repository error via Logger.error and does NOT rethrow (EVENT-08)', async () => {
    repo.save.mockRejectedValueOnce(new Error('db down'));
    const errorSpy = jest.fn();
    (service as any).logger = { error: errorSpy };

    await expect(
      service.ingest({ dto: { eventType: 'page_view' } as any, ip: null, townId: null, userAgent: null, user: null }),
    ).resolves.not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });
});
