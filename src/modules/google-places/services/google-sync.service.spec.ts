import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoogleSyncService } from './google-sync.service';
import { GoogleReviewSyncLog } from '../entities/google-review-sync-log.entity';
import { PlaceIdResolverService } from './place-id-resolver.service';
import { GOOGLE_REVIEWS_SOURCE } from '../interfaces/google-reviews-source.interface';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { GoogleReview } from '../entities/google-review.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLodging(overrides: Partial<Lodging> = {}): Lodging {
  return {
    id: 'entity-001',
    name: 'Hotel Test',
    googleMapsId: 'ChIJtest',
    googleMapsUrl: 'https://maps.google.com/?cid=123',
    lastGoogleSyncAt: null,
    town: {
      name: 'San Carlos',
      department: { name: 'Antioquia' } as any,
    } as any,
    ...overrides,
  } as Lodging;
}

/** Builds a minimal chainable QueryBuilder stub that includes all methods used in the service. */
function makeQbStub() {
  const stub: Record<string, jest.Mock> = {};
  const methods = [
    'insert', 'into', 'values', 'orUpdate', 'execute',
    'select', 'addSelect', 'from', 'where', 'setParameter',
  ];
  for (const m of methods) {
    stub[m] = jest.fn().mockReturnThis();
  }
  // getRawOne resolves to an avg/count result by default
  stub['getRawOne'] = jest.fn().mockResolvedValue({ avg: '4.5', count: '10' });
  return stub;
}

/**
 * Builds a minimal QueryRunner mock.
 * `entityOverride` controls what `qr.manager.getRepository(...).findOne(...)` returns,
 * allowing each test to inject the correct entity (e.g. with or without lastGoogleSyncAt).
 */
function makeQrMock(entityOverride?: Lodging) {
  const qb = makeQbStub();
  const manager = {
    delete: jest.fn().mockResolvedValue({ affected: 5 }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    getRepository: jest.fn().mockImplementation(() => ({
      findOne: jest.fn().mockResolvedValue(entityOverride ?? makeLodging()),
    })),
  };
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager,
    _qb: qb,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GoogleSyncService', () => {
  let service: GoogleSyncService;
  let syncLogRepo: { save: jest.Mock; create: jest.Mock };
  let placeIdResolver: { resolve: jest.Mock; placeIdToMapsUrl: jest.Mock };
  let source: { fetchReviews: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };
  let lodgingRepo: { findOne: jest.Mock };
  let restaurantRepo: { findOne: jest.Mock };
  let commerceRepo: { findOne: jest.Mock };

  /** Re-creates the module with a custom QR mock; returns the shared QR for assertions. */
  async function buildModule(entityOverride?: Lodging): Promise<ReturnType<typeof makeQrMock>> {
    syncLogRepo = {
      save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ id: 'log-uuid-001', status: 'running', ...entity })),
      create: jest.fn().mockImplementation((dto: any) => ({ id: 'log-uuid-001', ...dto })),
    };

    placeIdResolver = {
      resolve: jest.fn().mockResolvedValue('ChIJresolved'),
      placeIdToMapsUrl: jest.fn().mockReturnValue('https://www.google.com/maps/place/?q=place_id:ChIJresolved'),
    };

    source = {
      fetchReviews: jest.fn().mockResolvedValue([
        {
          reviewId: 'r1',
          authorName: 'Alice',
          rating: 5,
          text: 'Great!',
          reviewUrl: 'https://g.co/r1',
          reviewDate: new Date('2025-01-01'),
        },
        {
          reviewId: 'r2',
          authorName: 'Bob',
          rating: 4,
          text: 'Nice',
          reviewUrl: 'https://g.co/r2',
          reviewDate: new Date('2025-01-02'),
        },
      ]),
    };

    lodgingRepo = { findOne: jest.fn().mockResolvedValue(entityOverride ?? makeLodging()) };
    restaurantRepo = { findOne: jest.fn().mockResolvedValue(null) };
    commerceRepo = { findOne: jest.fn().mockResolvedValue(null) };

    const qrMock = makeQrMock(entityOverride);
    dataSource = { createQueryRunner: jest.fn().mockReturnValue(qrMock) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleSyncService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(GoogleReviewSyncLog), useValue: syncLogRepo },
        { provide: getRepositoryToken(Lodging), useValue: lodgingRepo },
        { provide: getRepositoryToken(Restaurant), useValue: restaurantRepo },
        { provide: getRepositoryToken(Commerce), useValue: commerceRepo },
        { provide: PlaceIdResolverService, useValue: placeIdResolver },
        { provide: GOOGLE_REVIEWS_SOURCE, useValue: source },
      ],
    }).compile();

    service = module.get<GoogleSyncService>(GoogleSyncService);
    return qrMock;
  }

  // -------------------------------------------------------------------------
  // Test: first sync — wipe + full pull
  // -------------------------------------------------------------------------
  it('(first sync) deletes existing reviews AND calls fetchReviews with since === null', async () => {
    const entity = makeLodging({ lastGoogleSyncAt: null });
    const qr = await buildModule(entity);

    await service.syncEntity('entity-001', 'lodging', 'manual');

    // delete must have been called with the entity coords
    expect(qr.manager.delete).toHaveBeenCalledWith(
      GoogleReview,
      expect.objectContaining({ entityId: 'entity-001', entityType: 'lodging' }),
    );

    // fetchReviews `since` arg must be null for first sync
    expect(source.fetchReviews).toHaveBeenCalledWith(
      expect.any(String),
      null,
    );
  });

  // -------------------------------------------------------------------------
  // Test: incremental sync — no wipe, cursor forwarded
  // -------------------------------------------------------------------------
  it('(incremental) does NOT delete reviews AND passes entity.lastGoogleSyncAt as since', async () => {
    const lastSync = new Date('2025-06-01T00:00:00Z');
    const entity = makeLodging({ lastGoogleSyncAt: lastSync });
    const qr = await buildModule(entity);

    await service.syncEntity('entity-001', 'lodging', 'cron');

    // delete must NOT have been called
    expect(qr.manager.delete).not.toHaveBeenCalled();

    // fetchReviews must receive the lastGoogleSyncAt date
    expect(source.fetchReviews).toHaveBeenCalledWith(
      expect.any(String),
      lastSync,
    );
  });

  // -------------------------------------------------------------------------
  // Test: success log — trigger echoed, reviewsTotal, last_google_sync_at
  // -------------------------------------------------------------------------
  it('(success log) saves sync-log with status=success and sets last_google_sync_at on entity', async () => {
    const qr = await buildModule();

    await service.syncEntity('entity-001', 'lodging', 'manual');

    // The second save call on syncLogRepo should be the success closure
    const saves = syncLogRepo.save.mock.calls;
    const successSave = saves.find((call: any[]) => call[0]?.status === 'success');
    expect(successSave).toBeDefined();
    expect(successSave![0]).toMatchObject({
      status: 'success',
      trigger: 'manual',
    });

    // entity update must have been called with lastGoogleSyncAt
    expect(qr.manager.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'entity-001' }),
      expect.objectContaining({ lastGoogleSyncAt: expect.any(Date) }),
    );
  });

  // -------------------------------------------------------------------------
  // Test: denorm — rating/reviewsCount derived from AVG/COUNT query
  // -------------------------------------------------------------------------
  it('(denorm) updates entity with googleMapsRating and googleMapsReviewsCount from AVG/COUNT', async () => {
    // QR mock getRawOne returns avg=4.5, count=10 by default
    const qr = await buildModule();

    await service.syncEntity('entity-001', 'lodging', 'cron');

    expect(qr.manager.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'entity-001' }),
      expect.objectContaining({
        googleMapsRating: 4.5,
        googleMapsReviewsCount: 10,
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Test: place_id resolve failure is NON-BLOCKING — sync still succeeds
  //       because the fetch uses the validated googleMapsUrl directly.
  // -------------------------------------------------------------------------
  it('(resolver non-blocking) resolver rejection does NOT fail the sync; still fetches and succeeds', async () => {
    const qr = await buildModule();

    // Override resolver to reject after module is built
    placeIdResolver.resolve.mockRejectedValue(new Error('place_id_not_resolvable'));

    const result = await service.syncEntity('entity-001', 'lodging', 'manual');

    // fetch still happened (uses entity.googleMapsUrl)
    expect(source.fetchReviews).toHaveBeenCalled();
    // committed, not rolled back
    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'success' });
  });

  // -------------------------------------------------------------------------
  // Test: URL gate — entity without a valid Places URL is SKIPPED (discarded).
  // -------------------------------------------------------------------------
  it('(skip) entity with missing/invalid googleMapsUrl → status=skipped, no fetch, no rating mutation', async () => {
    const entity = makeLodging({ googleMapsUrl: 'https://booking.com/hotel-xyz' as any });
    const qr = await buildModule(entity);

    const result = await service.syncEntity('entity-001', 'lodging', 'manual');

    // discarded: Apify never called, rating/count never updated
    expect(source.fetchReviews).not.toHaveBeenCalled();
    expect(qr.manager.update).not.toHaveBeenCalled();
    expect(qr.rollbackTransaction).toHaveBeenCalled();

    // sync-log saved with status='skipped'
    const skippedSave = syncLogRepo.save.mock.calls.find((c: any[]) => c[0]?.status === 'skipped');
    expect(skippedSave).toBeDefined();
    expect(result).toMatchObject({ status: 'skipped' });
  });

  it('(skip) entity with null googleMapsUrl is also skipped', async () => {
    const entity = makeLodging({ googleMapsUrl: null as any });
    await buildModule(entity);

    const result = await service.syncEntity('entity-001', 'lodging', 'manual');

    expect(source.fetchReviews).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'skipped' });
  });

  // -------------------------------------------------------------------------
  // Test: error path (fetch throws) → rollback + error log, no rating mutation.
  // -------------------------------------------------------------------------
  it('(error path) fetchReviews failure rolls back and saves error log; no rating mutation', async () => {
    const qr = await buildModule();

    source.fetchReviews.mockRejectedValue(new Error('apify timeout'));

    const result = await service.syncEntity('entity-001', 'lodging', 'manual');

    expect(qr.rollbackTransaction).toHaveBeenCalled();
    const errorSave = syncLogRepo.save.mock.calls.find((c: any[]) => c[0]?.status === 'error');
    expect(errorSave).toBeDefined();
    expect(errorSave![0].errorMessage).toMatch(/sync_error/);
    expect(qr.manager.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'error' });
  });
});
