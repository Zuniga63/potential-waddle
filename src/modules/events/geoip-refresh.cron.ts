import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';

/**
 * GeoipRefreshCron (EVENT-03) — weekly re-fetch of the GeoLite2-City `.mmdb`.
 *
 * MaxMind updates GeoLite2 ~2×/week; a weekly refresh keeps the local DB current.
 * It shells out to the same fail-soft boot script (`scripts/fetch-geolite.js`),
 * which rewrites the `.mmdb` in place. Because `GeoIpService` opened the Reader
 * with `watchForUpdates: true`, rewriting the file hot-reloads the Reader
 * automatically — no manual reader reset is needed here.
 */
@Injectable()
export class GeoipRefreshCron {
  private readonly logger = new Logger(GeoipRefreshCron.name);

  @Cron(CronExpression.EVERY_WEEK)
  refresh(): void {
    this.logger.log('(geoip-refresh) Starting weekly GeoLite2 database refresh...');
    exec('node scripts/fetch-geolite.js', (error, stdout, stderr) => {
      if (error) {
        // Fail-soft: a refresh failure leaves the previous .mmdb in place.
        this.logger.error(`(geoip-refresh) refresh failed: ${error.message}`, stderr);
        return;
      }
      if (stderr) this.logger.warn(`(geoip-refresh) ${stderr.trim()}`);
      this.logger.log('(geoip-refresh) GeoLite2 database refresh finished.');
    });
  }
}
