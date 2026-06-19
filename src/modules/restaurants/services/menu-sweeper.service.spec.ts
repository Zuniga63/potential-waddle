/**
 * Unit spec for MenuSweeperService.
 *
 * Covers:
 *   INTEG-05 — Sweeper marks stuck processing rows as failed
 *   T-07-11  — Filter constrained to status='processing' AND createdAt LessThan(now-10min)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';

import { MenuSweeperService } from './menu-sweeper.service';
import { Menu } from '../entities/menu.entity';

describe('MenuSweeperService', () => {
  let service: MenuSweeperService;
  let mockUpdate: jest.Mock;

  beforeEach(async () => {
    mockUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuSweeperService,
        {
          provide: getRepositoryToken(Menu),
          useValue: {
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<MenuSweeperService>(MenuSweeperService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Core sweeper logic: correct filter and payload
  // -------------------------------------------------------------------------
  it('calls repository.update with status=processing AND createdAt LessThan, setting status=failed', async () => {
    mockUpdate.mockResolvedValueOnce({ affected: 0 });

    await service.sweepStuckMenus();

    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const [criteria, payload] = mockUpdate.mock.calls[0] as [
      { status: string; createdAt: ReturnType<typeof LessThan> },
      { status: string },
    ];

    // Filter: must target only processing rows
    expect(criteria.status).toBe('processing');

    // Filter: createdAt must be a TypeORM FindOperator (LessThan)
    expect(criteria.createdAt).toBeDefined();
    expect(typeof criteria.createdAt).toBe('object');
    // LessThan wraps the value — check the internal value is approximately 10 min ago
    const tenMinMs = 10 * 60 * 1000;
    const threshold = (criteria.createdAt as unknown as { value: Date }).value;
    const diffMs = Date.now() - threshold.getTime();
    expect(diffMs).toBeGreaterThanOrEqual(tenMinMs - 1000); // within 1s tolerance
    expect(diffMs).toBeLessThan(tenMinMs + 5000);

    // Payload: must flip to failed
    expect(payload).toEqual({ status: 'failed' });
  });

  // -------------------------------------------------------------------------
  // When affected > 0: completes without throwing
  // -------------------------------------------------------------------------
  it('completes without throwing when affected is 2', async () => {
    mockUpdate.mockResolvedValueOnce({ affected: 2 });

    await expect(service.sweepStuckMenus()).resolves.toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // When affected is 0: completes without throwing
  // -------------------------------------------------------------------------
  it('completes without throwing when affected is 0', async () => {
    mockUpdate.mockResolvedValueOnce({ affected: 0 });

    await expect(service.sweepStuckMenus()).resolves.toBeUndefined();
  });
});
