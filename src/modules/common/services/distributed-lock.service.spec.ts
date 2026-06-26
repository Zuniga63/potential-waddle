import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DistributedLockService } from './distributed-lock.service';

describe('DistributedLockService', () => {
  let service: DistributedLockService;
  let dataSourceMock: { query: jest.Mock };

  beforeEach(async () => {
    dataSourceMock = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributedLockService,
        { provide: getDataSourceToken(), useValue: dataSourceMock },
      ],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
  });

  // ---------------------------------------------------------------------------
  // tryAcquire — lock available
  // ---------------------------------------------------------------------------
  it('tryAcquire returns true when pg_try_advisory_lock returns true', async () => {
    dataSourceMock.query.mockResolvedValue([{ pg_try_advisory_lock: true }]);

    const result = await service.tryAcquire(199001);

    expect(result).toBe(true);
    expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT pg_try_advisory_lock($1)', [199001]);
  });

  // ---------------------------------------------------------------------------
  // tryAcquire — lock held by another session
  // ---------------------------------------------------------------------------
  it('tryAcquire returns false when pg_try_advisory_lock returns false (lock held)', async () => {
    dataSourceMock.query.mockResolvedValue([{ pg_try_advisory_lock: false }]);

    const result = await service.tryAcquire(199001);

    expect(result).toBe(false);
    expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT pg_try_advisory_lock($1)', [199001]);
  });

  // ---------------------------------------------------------------------------
  // release — calls pg_advisory_unlock with the lock key
  // ---------------------------------------------------------------------------
  it('release calls pg_advisory_unlock with the lock key and resolves without throwing', async () => {
    dataSourceMock.query.mockResolvedValue([{ pg_advisory_unlock: true }]);

    await expect(service.release(199001)).resolves.toBeUndefined();
    expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT pg_advisory_unlock($1)', [199001]);
  });

  // ---------------------------------------------------------------------------
  // tryAcquire — fail-safe: DB error returns false instead of throwing
  // ---------------------------------------------------------------------------
  it('tryAcquire returns false (fail-safe) when the DB query rejects', async () => {
    dataSourceMock.query.mockRejectedValue(new Error('db connection refused'));

    const result = await service.tryAcquire(199001);

    expect(result).toBe(false);
  });
});
