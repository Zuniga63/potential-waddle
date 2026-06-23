// BIZ-08 controller wiring: the analytics route asserts ownership BEFORE querying.
//   - owner -> 200 with the documented shape
//   - non-owner -> 403 (the resolver throws; the controller must surface it, NOT swallow it)
//   - assertCanRead is called BEFORE getEntityAnalytics (gate ordering)
// 401 (no Bearer) and 400 (bad enum) are enforced by @Auth() + the global ValidationPipe and are
// covered at the e2e/pipe layer; here we assert the controller's own gate logic.
import { ForbiddenException } from '@nestjs/common';
import { EventsController } from './events.controller';

describe('EventsController.getEntityAnalytics (BIZ-08 — IDOR gate)', () => {
  let controller: EventsController;
  let ownership: { assertCanRead: jest.Mock };
  let analytics: { getEntityAnalytics: jest.Mock };

  const OWNER = { id: 'user-owner' } as any;
  const NON_OWNER = { id: 'user-other' } as any;
  const QUERY = { entityType: 'lodging', entityId: 'l-1' } as any;
  const SHAPE = { summary: {}, deltas: {}, trend: [], byCity: [], byChannel: {}, range: {} };

  beforeEach(() => {
    ownership = { assertCanRead: jest.fn() };
    analytics = { getEntityAnalytics: jest.fn().mockResolvedValue(SHAPE) };
    controller = new EventsController({} as any, ownership as any, analytics as any);
  });

  it('owner -> 200 with summary/deltas/trend/byCity/byChannel keys', async () => {
    ownership.assertCanRead.mockResolvedValueOnce({ townId: 'town-1' });
    const res = await controller.getEntityAnalytics(QUERY, OWNER);
    expect(res).toEqual(SHAPE);
    expect(analytics.getEntityAnalytics).toHaveBeenCalledWith({ ...QUERY, townId: 'town-1' });
  });

  it('non-owner -> ForbiddenException (403) and the query is NEVER run', async () => {
    ownership.assertCanRead.mockRejectedValueOnce(new ForbiddenException());
    await expect(controller.getEntityAnalytics(QUERY, NON_OWNER)).rejects.toBeInstanceOf(ForbiddenException);
    expect(analytics.getEntityAnalytics).not.toHaveBeenCalled();
  });

  it('asserts ownership BEFORE querying analytics (gate ordering)', async () => {
    const order: string[] = [];
    ownership.assertCanRead.mockImplementationOnce(async () => {
      order.push('assertCanRead');
      return { townId: 'town-1' };
    });
    analytics.getEntityAnalytics.mockImplementationOnce(async () => {
      order.push('getEntityAnalytics');
      return SHAPE;
    });
    await controller.getEntityAnalytics(QUERY, OWNER);
    expect(order).toEqual(['assertCanRead', 'getEntityAnalytics']);
  });
});
