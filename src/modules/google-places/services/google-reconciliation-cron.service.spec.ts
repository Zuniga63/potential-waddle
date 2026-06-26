import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoogleReconciliationCronService } from './google-reconciliation-cron.service';
import { GoogleSyncService } from './google-sync.service';
import { DistributedLockService } from 'src/modules/common/services/distributed-lock.service';
import { SubscriptionsService } from 'src/modules/subscriptions/services/subscriptions.service';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal chainable QueryBuilder stub for eligibility query tests.
 * `getMany` resolves the array passed during setup.
 */
function makeQbStub(entities: any[] = []) {
  const stub: Record<string, jest.Mock> = {};
  const chainMethods = ['select', 'where', 'andWhere'];
  for (const m of chainMethods) {
    stub[m] = jest.fn().mockReturnThis();
  }
  stub['getMany'] = jest.fn().mockResolvedValue(entities);
  return stub;
}

/** Makes a fake sync-log result for reconcileEntity mock. */
function fakeReconcileLog(entityId: string) {
  return { id: `log-reconcile-${entityId}`, status: 'success', entityId };
}

// Valid Places URL (passes isPlacesGeneratedUrl)
const VALID_URL = 'https://maps.google.com/?cid=123456789';
// Invalid URL (fails isPlacesGeneratedUrl)
const INVALID_URL = 'https://example.com/some-business';

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('GoogleReconciliationCronService', () => {
  let service: GoogleReconciliationCronService;
  let lockService: { tryAcquire: jest.Mock; release: jest.Mock };
  let googleSyncService: { reconcileEntity: jest.Mock };
  let subscriptionsService: { getActiveSubscribedEntityIds: jest.Mock };
  let lodgingRepo: { createQueryBuilder: jest.Mock };
  let restaurantRepo: { createQueryBuilder: jest.Mock };
  let commerceRepo: { createQueryBuilder: jest.Mock };

  async function buildModule() {
    lockService = {
      tryAcquire: jest.fn().mockResolvedValue(true),
      release: jest.fn().mockResolvedValue(undefined),
    };
    googleSyncService = {
      reconcileEntity: jest.fn().mockImplementation((id: string) => Promise.resolve(fakeReconcileLog(id))),
    };
    subscriptionsService = {
      getActiveSubscribedEntityIds: jest.fn().mockResolvedValue(['lodging-sub-01']),
    };

    // Default: no entities returned
    lodgingRepo = { createQueryBuilder: jest.fn().mockReturnValue(makeQbStub([])) };
    restaurantRepo = { createQueryBuilder: jest.fn().mockReturnValue(makeQbStub([])) };
    commerceRepo = { createQueryBuilder: jest.fn().mockReturnValue(makeQbStub([])) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleReconciliationCronService,
        { provide: DistributedLockService, useValue: lockService },
        { provide: GoogleSyncService, useValue: googleSyncService },
        { provide: SubscriptionsService, useValue: subscriptionsService },
        { provide: getRepositoryToken(Lodging), useValue: lodgingRepo },
        { provide: getRepositoryToken(Restaurant), useValue: restaurantRepo },
        { provide: getRepositoryToken(Commerce), useValue: commerceRepo },
      ],
    }).compile();

    service = module.get<GoogleReconciliationCronService>(GoogleReconciliationCronService);
  }

  // -------------------------------------------------------------------------
  // Lock guard: when tryAcquire returns false, cron skips without calling reconcileEntity
  // -------------------------------------------------------------------------
  it('(lock-skip) when tryAcquire returns false, runMonthly does NOT call reconcileEntity', async () => {
    await buildModule();
    lockService.tryAcquire.mockResolvedValue(false);

    // Inject an eligible entity so we can confirm reconcileEntity is NOT called
    lodgingRepo.createQueryBuilder.mockReturnValue(
      makeQbStub([{ id: 'lodging-001', googleMapsUrl: VALID_URL, lastGoogleSyncAt: new Date() }]),
    );

    await service.runMonthly();

    expect(lockService.tryAcquire).toHaveBeenCalledWith(199001);
    expect(googleSyncService.reconcileEntity).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Lock guard: when acquired, release is called in finally (even if processing throws)
  // -------------------------------------------------------------------------
  it('(lock-release) release is called in finally even if processing throws', async () => {
    await buildModule();
    subscriptionsService.getActiveSubscribedEntityIds.mockRejectedValue(new Error('DB error'));

    await service.runMonthly();

    expect(lockService.tryAcquire).toHaveBeenCalledWith(199001);
    expect(lockService.release).toHaveBeenCalledWith(199001);
  });

  // -------------------------------------------------------------------------
  // Eligibility — NOT stale-gated:
  // A business synced recently (within 24h) is STILL included in the monthly reconciliation.
  // This distinguishes the reconciliation cron from the weekly cron.
  // -------------------------------------------------------------------------
  it('(eligibility — no stale gate) includes entity with recent lastGoogleSyncAt (not stale-gated)', async () => {
    await buildModule();

    // Entity synced 1 hour ago — weekly cron would EXCLUDE it, monthly must INCLUDE it
    const recentlySynced = {
      id: 'lodging-recent',
      googleMapsUrl: VALID_URL,
      lastGoogleSyncAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
    };

    subscriptionsService.getActiveSubscribedEntityIds.mockResolvedValue(['lodging-recent']);
    lodgingRepo.createQueryBuilder.mockReturnValue(makeQbStub([recentlySynced]));

    await service.runMonthly();

    // Must be processed despite being recently synced
    expect(googleSyncService.reconcileEntity).toHaveBeenCalledWith('lodging-recent', 'lodging');
  });

  // -------------------------------------------------------------------------
  // Eligibility: still excludes entities without a valid Places URL
  // -------------------------------------------------------------------------
  it('(eligibility) excludes entity with invalid googleMapsUrl', async () => {
    await buildModule();
    const invalidUrlLodging = {
      id: 'lodging-bad-url',
      googleMapsUrl: INVALID_URL,
      lastGoogleSyncAt: null,
    };
    lodgingRepo.createQueryBuilder.mockReturnValue(makeQbStub([invalidUrlLodging]));

    await service.runMonthly();

    expect(googleSyncService.reconcileEntity).not.toHaveBeenCalledWith('lodging-bad-url', 'lodging');
  });

  // -------------------------------------------------------------------------
  // Sequential processing: each eligible entity is processed via reconcileEntity exactly once
  // -------------------------------------------------------------------------
  it('(sequential) each eligible entity is processed via reconcileEntity(id, type) exactly once', async () => {
    await buildModule();
    const entities = [
      { id: 'lodging-001', googleMapsUrl: VALID_URL, lastGoogleSyncAt: null },
      { id: 'lodging-002', googleMapsUrl: VALID_URL, lastGoogleSyncAt: new Date() },
    ];
    subscriptionsService.getActiveSubscribedEntityIds.mockResolvedValue(['lodging-001', 'lodging-002']);
    lodgingRepo.createQueryBuilder.mockReturnValue(makeQbStub(entities));

    await service.runMonthly();

    expect(googleSyncService.reconcileEntity).toHaveBeenCalledTimes(2);
    expect(googleSyncService.reconcileEntity).toHaveBeenCalledWith('lodging-001', 'lodging');
    expect(googleSyncService.reconcileEntity).toHaveBeenCalledWith('lodging-002', 'lodging');
  });

  // -------------------------------------------------------------------------
  // Stale-gate ABSENT: verify the QueryBuilder is NOT called with a stale threshold condition.
  // The weekly cron adds .andWhere('lastGoogleSyncAt IS NULL OR ... < threshold').
  // The monthly cron must NOT add this clause.
  // -------------------------------------------------------------------------
  it('(no stale-gate) queryBuilder.andWhere is NOT called with a lastGoogleSyncAt threshold', async () => {
    await buildModule();
    const qbStub = makeQbStub([]);
    lodgingRepo.createQueryBuilder.mockReturnValue(qbStub);

    await service.runMonthly();

    // andWhere must NOT have been called with a lastGoogleSyncAt condition
    const andWhereCalls: string[] = qbStub.andWhere.mock.calls.map((c: any[]) => String(c[0]));
    const hasStaleGate = andWhereCalls.some((call) => call.includes('lastGoogleSyncAt'));
    expect(hasStaleGate).toBe(false);
  });
});
