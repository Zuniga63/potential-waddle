// UNSKIP in Plan 02 once GeoIpService/BotFilterService/EventsService exist.
//
// EVENT-01/02/08: EventsService.ingest builds a row and persists it fire-and-forget.
//   - town_id comes from the server-derived townId arg, NEVER from the client dto (T-15-01).
//   - a repository error is logged via Logger.error and NOT rethrown (non-blocking, EVENT-08).
//   - no `ipAddress` field is ever passed to repository.create (D-06).
//
// This spec defines the contract Plan 02's EventsService must satisfy. describe.skip
// until the service lands in Plan 02. Module paths (`./events.service`,
// `./entities`) are required lazily inside the skipped block so this file compiles
// before the service exists.
describe.skip('EventsService.ingest (EVENT-01/02/08) — UNSKIP in Plan 02', () => {
  let service: any;
  let repo: { create: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    repo = { create: jest.fn((row) => row), save: jest.fn().mockResolvedValue(undefined) };
    // const { EventsService } = require('./events.service');
    // service = new EventsService(repo, geoIpServiceMock, botFilterServiceMock);
  });

  it('takes town_id from the passed townId arg, never from the dto body (T-15-01)', async () => {
    await service.ingest({
      dto: { eventType: 'page_view' },
      ip: '1.2.3.4',
      townId: 'server-derived-town',
      userAgent: 'Chrome',
      user: null,
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ townId: 'server-derived-town' }));
  });

  it('never passes an ipAddress field to repository.create (D-06)', async () => {
    await service.ingest({
      dto: { eventType: 'page_view' },
      ip: '1.2.3.4',
      townId: null,
      userAgent: 'Chrome',
      user: null,
    });
    const created = repo.create.mock.calls[0][0];
    expect(created).not.toHaveProperty('ipAddress');
    expect(created).not.toHaveProperty('ip');
  });

  it('logs a repository error via Logger.error and does NOT rethrow (EVENT-08)', async () => {
    repo.save.mockRejectedValueOnce(new Error('db down'));
    const errorSpy = jest.fn();
    (service as any).logger = { error: errorSpy };

    await expect(
      service.ingest({ dto: { eventType: 'page_view' }, ip: null, townId: null, userAgent: null, user: null }),
    ).resolves.not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });
});
