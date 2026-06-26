import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, HttpException, HttpStatus, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { GoogleSyncManualService } from './google-sync-manual.service';
import { GoogleSyncService } from './google-sync.service';
import { GoogleReviewSyncLog } from '../entities/google-review-sync-log.entity';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { User } from 'src/modules/users/entities/user.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-001',
    isSuperUser: false,
    ...overrides,
  } as User;
}

function makeLodging(overrides: Record<string, unknown> = {}): Lodging {
  return {
    id: 'entity-001',
    googleMapsUrl: 'https://maps.google.com/?cid=1234567890',
    user: { id: 'user-001' } as User,
    ...overrides,
  } as unknown as Lodging;
}

// ---------------------------------------------------------------------------
// Module factory
// ---------------------------------------------------------------------------

async function buildModule(lodgingFindOne: jest.Mock, syncLogFindOne: jest.Mock, syncLogFindAndCount: jest.Mock, syncEntityMock: jest.Mock) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GoogleSyncManualService,
      {
        provide: GoogleSyncService,
        useValue: { syncEntity: syncEntityMock },
      },
      {
        provide: getRepositoryToken(GoogleReviewSyncLog),
        useValue: {
          findOne: syncLogFindOne,
          findAndCount: syncLogFindAndCount,
        },
      },
      {
        provide: getRepositoryToken(Lodging),
        useValue: { findOne: lodgingFindOne },
      },
      {
        provide: getRepositoryToken(Restaurant),
        useValue: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      },
      {
        provide: getRepositoryToken(Commerce),
        useValue: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      },
    ],
  }).compile();

  return module.get<GoogleSyncManualService>(GoogleSyncManualService);
}

// ---------------------------------------------------------------------------
// Tests: triggerSync
// ---------------------------------------------------------------------------

describe('GoogleSyncManualService', () => {
  describe('triggerSync', () => {
    it('should throw BadRequestException for invalid entity type', async () => {
      const service = await buildModule(
        jest.fn(),
        jest.fn(),
        jest.fn(),
        jest.fn(),
      );

      await expect(service.triggerSync('entity-001', 'guide' as any, makeUser())).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when entity not found', async () => {
      const lodgingFindOne = jest.fn().mockResolvedValue(null);
      const service = await buildModule(
        lodgingFindOne,
        jest.fn(),
        jest.fn(),
        jest.fn(),
      );

      await expect(service.triggerSync('entity-001', 'lodging', makeUser())).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner tries to sync', async () => {
      const entity = makeLodging({ user: { id: 'other-user' } });
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      const service = await buildModule(
        lodgingFindOne,
        jest.fn(),
        jest.fn(),
        jest.fn(),
      );
      const nonOwner = makeUser({ id: 'user-999', isSuperUser: false });

      await expect(service.triggerSync('entity-001', 'lodging', nonOwner)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when entity.user is null and user is not superUser', async () => {
      // Pitfall 4: forcedPublic entity with null user — should throw ForbiddenException, NOT TypeError
      const entity = makeLodging({ user: null });
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      const service = await buildModule(
        lodgingFindOne,
        jest.fn(),
        jest.fn(),
        jest.fn(),
      );
      const nonOwner = makeUser({ id: 'user-001', isSuperUser: false });

      await expect(service.triggerSync('entity-001', 'lodging', nonOwner)).rejects.toThrow(ForbiddenException);
    });

    it('should allow super admin to bypass IDOR even on non-owned entity', async () => {
      // Super bypass — still fail on URL check (no valid URL) but NOT 403
      const entity = makeLodging({ user: { id: 'other-user' }, googleMapsUrl: null });
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      const service = await buildModule(
        lodgingFindOne,
        jest.fn(),
        jest.fn(),
        jest.fn(),
      );
      const superAdmin = makeUser({ id: 'super-001', isSuperUser: true });

      // Should throw 422 (URL gate), not 403
      await expect(service.triggerSync('entity-001', 'lodging', superAdmin)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when entity has no valid Places URL (422)', async () => {
      const entity = makeLodging({ googleMapsUrl: 'https://example.com/not-a-maps-url' });
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      const service = await buildModule(
        lodgingFindOne,
        jest.fn(),
        jest.fn(),
        jest.fn(),
      );
      const owner = makeUser({ id: 'user-001' });

      const error = await service.triggerSync('entity-001', 'lodging', owner).catch(e => e);
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      // Spanish message
      expect(error.message).toMatch(/Google Maps/i);
    });

    it('should throw 429 with remainingMinutes when within 1h cooldown', async () => {
      const entity = makeLodging(); // valid URL
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      // Recent sync-log startedAt = 30 minutes ago
      const recentLog = {
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        entityId: 'entity-001',
        entityType: 'lodging',
      };
      const syncLogFindOne = jest.fn().mockResolvedValue(recentLog);
      const service = await buildModule(
        lodgingFindOne,
        syncLogFindOne,
        jest.fn(),
        jest.fn(),
      );
      const owner = makeUser({ id: 'user-001' });

      const error = await service.triggerSync('entity-001', 'lodging', owner).catch(e => e);
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const body = error.getResponse();
      expect(body).toHaveProperty('remainingMinutes');
      expect((body as any).remainingMinutes).toBeGreaterThan(0);
    });

    it('should return 202-queued response immediately without awaiting syncEntity (happy path)', async () => {
      const entity = makeLodging(); // valid URL, owner matches user-001
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      // No recent sync log
      const syncLogFindOne = jest.fn().mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolveSync!: (value: any) => void;
      // syncEntity returns a never-resolving promise until we explicitly resolve it
      const neverResolvingPromise = new Promise<any>(resolve => {
        resolveSync = resolve;
      });
      const syncEntityMock = jest.fn().mockReturnValue(neverResolvingPromise);

      const service = await buildModule(
        lodgingFindOne,
        syncLogFindOne,
        jest.fn(),
        syncEntityMock,
      );
      const owner = makeUser({ id: 'user-001' });

      // triggerSync should resolve BEFORE syncEntity resolves
      const result = await service.triggerSync('entity-001', 'lodging', owner);

      // syncEntity was called exactly once with 'manual' trigger
      expect(syncEntityMock).toHaveBeenCalledTimes(1);
      expect(syncEntityMock).toHaveBeenCalledWith('entity-001', 'lodging', 'manual');

      // Response shape: 202-queued
      expect(result).toMatchObject({
        entityId: 'entity-001',
        entityType: 'lodging',
        status: 'queued',
      });
      expect(result.message).toBeTruthy();

      // Cleanup: resolve the pending promise so Jest doesn't complain about open handles
      resolveSync(undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // Tests: getSyncHistory
  // ---------------------------------------------------------------------------
  describe('getSyncHistory', () => {
    it('should throw ForbiddenException when non-owner requests history', async () => {
      const entity = makeLodging({ user: { id: 'other-user' } });
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      const service = await buildModule(
        lodgingFindOne,
        jest.fn(),
        jest.fn(),
        jest.fn(),
      );
      const nonOwner = makeUser({ id: 'user-999', isSuperUser: false });

      await expect(service.getSyncHistory('entity-001', 'lodging', nonOwner)).rejects.toThrow(ForbiddenException);
    });

    it('should return paginated history when owner requests (findAndCount)', async () => {
      const entity = makeLodging();
      const lodgingFindOne = jest.fn().mockResolvedValue(entity);
      const logs = [
        { id: 'log-1', trigger: 'manual', status: 'success', reviewsNew: 5, reviewsTotal: 50, startedAt: new Date(), endedAt: new Date(), errorMessage: null },
        { id: 'log-2', trigger: 'cron', status: 'error', reviewsNew: null, reviewsTotal: null, startedAt: new Date(), endedAt: null, errorMessage: 'Apify error' },
      ];
      const syncLogFindAndCount = jest.fn().mockResolvedValue([logs, 2]);
      const service = await buildModule(
        lodgingFindOne,
        jest.fn(),
        syncLogFindAndCount,
        jest.fn(),
      );
      const owner = makeUser({ id: 'user-001' });

      const result = await service.getSyncHistory('entity-001', 'lodging', owner, 1, 20);

      expect(result).toMatchObject({
        currentPage: 1,
        count: 2,
        data: expect.any(Array),
      });
      expect(result.data).toHaveLength(2);
      expect(syncLogFindAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityId: 'entity-001', entityType: 'lodging' },
          order: { startedAt: 'DESC' },
          skip: 0,
          take: 20,
        }),
      );
    });
  });
});
