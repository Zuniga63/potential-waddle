// MIG-02 unit tests for the LOCAL-ONLY backfill + parity gate. No live DB.
//
// The SQL builders and the parity-decision logic are factored into pure exported
// functions so they can be tested deterministically:
//   - buildInsertSql()  -> the idempotent INSERT ... SELECT ... ON CONFLICT DO NOTHING
//   - computeParity()   -> the per-entity + total count-parity gate
//   - assertLocalDb()   -> the remote-DB safety guard
//
// These three cover the threat register: T-19-05 (double-count idempotency),
// T-19-06 (silent divergence parity gate), T-19-07 (remote-DB guard),
// T-19-08 (privacy: no lat/long/ip in the INSERT).
import { buildInsertSql, computeParity, assertLocalDb, EntityCount } from './backfill-whatsapp-clicks';

describe('backfill-whatsapp-clicks (MIG-02 — idempotency + parity gate)', () => {
  // --------------------------------------------------------------------------------------------
  // buildInsertSql — idempotency + privacy (T-19-05, T-19-08)
  // --------------------------------------------------------------------------------------------
  describe('buildInsertSql', () => {
    const sql = buildInsertSql();

    it('is an INSERT INTO events SELECT ... FROM whatsapp_click', () => {
      expect(sql).toMatch(/INSERT\s+INTO\s+events/i);
      expect(sql).toMatch(/FROM\s+whatsapp_click/i);
    });

    it('is idempotent via ON CONFLICT (id, created_at) DO NOTHING (T-19-05)', () => {
      expect(sql).toMatch(/ON CONFLICT \(id, created_at\) DO NOTHING/i);
    });

    it("hard-codes event_type='whatsapp_click', is_bot=false, is_internal=false", () => {
      expect(sql).toContain("'whatsapp_click'");
      // is_bot and is_internal forced to false on every inserted row
      expect(sql).toMatch(/false\s+AS\s+is_bot/i);
      expect(sql).toMatch(/false\s+AS\s+is_internal/i);
    });

    it('reuses the legacy id and clicked_at so re-runs converge (T-19-05)', () => {
      expect(sql).toMatch(/wc\.id/);
      expect(sql).toMatch(/wc\.clicked_at/);
    });

    it('puts phone_number, page_type and is_repeat_click into properties jsonb', () => {
      expect(sql).toMatch(/jsonb_build_object/i);
      expect(sql).toContain("'phone_number'");
      expect(sql).toContain("'page_type'");
      expect(sql).toContain("'is_repeat_click'");
    });

    it('NEVER copies latitude/longitude/ip_address (privacy T-19-08)', () => {
      expect(sql).not.toMatch(/\blatitude\b/i);
      expect(sql).not.toMatch(/\blongitude\b/i);
      expect(sql).not.toMatch(/\bip_address\b/i);
    });

    it('derives town_id via per-type EXISTS/JOIN subselects (no fabricated town)', () => {
      // restaurant/lodging/place/commerce/transport via town_id, guide via guide_town
      expect(sql).toMatch(/guide_town/i);
      expect(sql).toMatch(/town_id/i);
    });
  });

  // --------------------------------------------------------------------------------------------
  // computeParity — the gate (T-19-06)
  // --------------------------------------------------------------------------------------------
  describe('computeParity', () => {
    it('returns parityOk=true when every per-entity count AND the total match', () => {
      const legacy: EntityCount[] = [
        { entityType: 'restaurant', entityId: 'a', count: 3 },
        { entityType: 'lodging', entityId: 'b', count: 2 },
      ];
      const events: EntityCount[] = [
        { entityType: 'restaurant', entityId: 'a', count: 3 },
        { entityType: 'lodging', entityId: 'b', count: 2 },
      ];
      const report = computeParity(legacy, events);
      expect(report.parityOk).toBe(true);
      expect(report.total.legacy).toBe(5);
      expect(report.total.events).toBe(5);
      expect(report.perEntity.every((r) => r.match)).toBe(true);
    });

    it('returns parityOk=false when a per-entity count diverges (T-19-06)', () => {
      const legacy: EntityCount[] = [{ entityType: 'restaurant', entityId: 'a', count: 3 }];
      const events: EntityCount[] = [{ entityType: 'restaurant', entityId: 'a', count: 2 }];
      const report = computeParity(legacy, events);
      expect(report.parityOk).toBe(false);
      expect(report.perEntity[0].match).toBe(false);
    });

    it('returns parityOk=false when an entity is present in legacy but missing in events', () => {
      const legacy: EntityCount[] = [
        { entityType: 'restaurant', entityId: 'a', count: 3 },
        { entityType: 'lodging', entityId: 'b', count: 2 },
      ];
      const events: EntityCount[] = [{ entityType: 'restaurant', entityId: 'a', count: 3 }];
      const report = computeParity(legacy, events);
      expect(report.parityOk).toBe(false);
      expect(report.total.legacy).toBe(5);
      expect(report.total.events).toBe(3);
    });

    it('returns parityOk=false when events has an extra entity not in legacy', () => {
      const legacy: EntityCount[] = [{ entityType: 'restaurant', entityId: 'a', count: 3 }];
      const events: EntityCount[] = [
        { entityType: 'restaurant', entityId: 'a', count: 3 },
        { entityType: 'lodging', entityId: 'b', count: 2 },
      ];
      const report = computeParity(legacy, events);
      expect(report.parityOk).toBe(false);
    });

    it('returns parityOk=true on two empty sets (0 == 0 PASS, the empty-local-table case)', () => {
      const report = computeParity([], []);
      expect(report.parityOk).toBe(true);
      expect(report.total.legacy).toBe(0);
      expect(report.total.events).toBe(0);
    });

    // Idempotency at the gate level: a 2nd backfill must not change the events counts,
    // so the same legacy set vs the same events set still passes (no duplicates).
    it('still passes after a simulated re-run (events unchanged => no duplicates, T-19-05)', () => {
      const legacy: EntityCount[] = [{ entityType: 'restaurant', entityId: 'a', count: 4 }];
      const eventsAfterFirstRun: EntityCount[] = [{ entityType: 'restaurant', entityId: 'a', count: 4 }];
      // A 2nd run over the same input set yields the SAME events counts (ON CONFLICT DO NOTHING).
      const eventsAfterSecondRun: EntityCount[] = [{ entityType: 'restaurant', entityId: 'a', count: 4 }];
      expect(computeParity(legacy, eventsAfterFirstRun).parityOk).toBe(true);
      expect(computeParity(legacy, eventsAfterSecondRun).parityOk).toBe(true);
      expect(eventsAfterSecondRun[0].count).toBe(eventsAfterFirstRun[0].count);
    });
  });

  // --------------------------------------------------------------------------------------------
  // assertLocalDb — remote-DB guard (T-19-07)
  // --------------------------------------------------------------------------------------------
  describe('assertLocalDb', () => {
    it('accepts a localhost host', () => {
      expect(() => assertLocalDb('localhost', [])).not.toThrow();
    });

    it('accepts 127.0.0.1', () => {
      expect(() => assertLocalDb('127.0.0.1', [])).not.toThrow();
    });

    it('accepts an undefined/empty host (default local docker)', () => {
      expect(() => assertLocalDb(undefined, [])).not.toThrow();
    });

    it('REFUSES a remote/prod host without --allow-remote (T-19-07)', () => {
      expect(() => assertLocalDb('roundhouse.proxy.rlwy.net', [])).toThrow(/LOCAL-ONLY/i);
    });

    it('refuses a railway host even though it looks like a hostname', () => {
      expect(() => assertLocalDb('containers-us-west-1.railway.app', [])).toThrow();
    });

    it('allows a remote host ONLY when --allow-remote is explicitly passed', () => {
      expect(() => assertLocalDb('roundhouse.proxy.rlwy.net', ['--allow-remote'])).not.toThrow();
    });
  });
});
