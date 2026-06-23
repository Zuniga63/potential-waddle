import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import maxmind, { CityResponse, Reader } from 'maxmind';

/**
 * Coarse geo derived server-side from the request IP (D-06): country + region/
 * department + city ONLY. No precise coordinates, no raw IP — the IP is used only
 * in-memory for the lookup and discarded by the caller (Ley 1581 compliance).
 */
export interface CoarseGeo {
  country: string | null;
  department: string | null;
  city: string | null;
}

/**
 * GeoIpService — singleton MaxMind reader over the local GeoLite2-City `.mmdb`.
 *
 * Fail-soft by design (Pitfall 4): if the DB file is absent at boot the reader
 * stays null and every lookup degrades to all-null geo — it NEVER crashes boot
 * and NEVER throws inside the fire-and-forget ingest path. `watchForUpdates`
 * hot-reloads the reader after the weekly refresh rewrites the file (Plan 03).
 */
@Injectable()
export class GeoIpService implements OnModuleInit {
  private readonly logger = new Logger(GeoIpService.name);
  private reader: Reader<CityResponse> | null = null;
  private readonly dbPath = process.env.GEOLITE_DB_PATH ?? './geoip/GeoLite2-City.mmdb';

  async onModuleInit(): Promise<void> {
    try {
      this.reader = await maxmind.open<CityResponse>(this.dbPath, { watchForUpdates: true });
    } catch (e) {
      this.logger.warn(`GeoLite2 DB not available at ${this.dbPath} — geo disabled`);
      this.reader = null;
    }
  }

  /**
   * Resolve an IP to coarse geo. Returns all-null for: no reader (DB missing),
   * no/invalid IP, private/loopback IPs, or an unresolved address. Never throws.
   * D-06: returns coarse fields only (no precise coordinates); the caller stores no IP.
   */
  lookup(ip: string | undefined): CoarseGeo {
    const empty: CoarseGeo = { country: null, department: null, city: null };
    if (!this.reader || !ip || !maxmind.validate(ip)) return empty;

    const res = this.reader.get(ip);
    if (!res) return empty;

    return {
      country: res.country?.names?.en ?? null,
      department: res.subdivisions?.[0]?.names?.en ?? null,
      city: res.city?.names?.en ?? null,
    };
  }
}
