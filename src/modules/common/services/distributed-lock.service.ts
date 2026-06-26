import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * DistributedLockService — Postgres advisory lock adapter.
 *
 * Uses `pg_try_advisory_lock` / `pg_advisory_unlock` to coordinate cross-instance
 * mutual exclusion without any schema migration or external dependency.
 *
 * Advisory locks are SESSION-SCOPED: they are automatically released when the database
 * connection closes (Railway restart, process crash). A stuck lock therefore cannot
 * deadlock the schedule permanently — the next cron tick will successfully acquire the
 * lock once the stale session is gone.
 *
 * Usage in a cron:
 * ```typescript
 * const acquired = await this.lockService.tryAcquire(LOCK_KEY);
 * if (!acquired) { this.logger.warn('skipping — another instance holds lock'); return; }
 * try {
 *   // ... do work
 * } finally {
 *   await this.lockService.release(LOCK_KEY);
 * }
 * ```
 */
@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Attempts to acquire a Postgres session-level advisory lock for the given `lockKey`.
   *
   * @param lockKey - A stable integer key identifying the lock (e.g. 199001 for google-sync-weekly).
   * @returns `true` if the lock was acquired; `false` if already held by another session.
   *          Returns `false` (fail-safe) on any DB error — a transient DB hiccup causes
   *          the caller to skip its run rather than crash the scheduler.
   */
  async tryAcquire(lockKey: number): Promise<boolean> {
    try {
      const result = await this.dataSource.query<[{ pg_try_advisory_lock: boolean }]>(
        'SELECT pg_try_advisory_lock($1)',
        [lockKey],
      );
      return result[0]?.pg_try_advisory_lock === true;
    } catch (error) {
      this.logger.error(
        `(DistributedLockService) tryAcquire failed for key ${lockKey}: ${(error as Error).message}`,
      );
      // Fail-safe: if we cannot confirm the lock was acquired, do not proceed.
      // This is the safe default for a periodic job — a skipped run is far preferable
      // to two overlapping runs corrupting data or exhausting Apify credits.
      return false;
    }
  }

  /**
   * Releases the Postgres session-level advisory lock for the given `lockKey`.
   *
   * Errors are logged but NOT re-thrown: `release()` is designed to run inside a `finally`
   * block. If release fails, the session-scoped lock will auto-release when the connection
   * closes — the schedule is not permanently blocked.
   *
   * @param lockKey - The same integer key passed to `tryAcquire`.
   */
  async release(lockKey: number): Promise<void> {
    try {
      await this.dataSource.query('SELECT pg_advisory_unlock($1)', [lockKey]);
    } catch (error) {
      this.logger.error(
        `(DistributedLockService) release failed for key ${lockKey}: ${(error as Error).message}`,
      );
      // Do not rethrow — the session-scoped lock auto-releases on connection close.
    }
  }
}
