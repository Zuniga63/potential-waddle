/**
 * Single global flag that gates the entire T&C enforcement feature.
 *
 * Read via `TERMS_ENFORCEMENT_ENABLED` env var. Default: enabled (true).
 * Set `TERMS_ENFORCEMENT_ENABLED=false` to disable across the whole feature:
 *  - signup no longer requires/records acceptedUserTermsId
 *  - GET /terms/me/status returns all booleans = true (so frontend doesn't gate UI)
 *  - admin endpoints remain accessible for content prep — they're not gated by this flag
 *
 * Frontend reads the same concept via `NEXT_PUBLIC_TERMS_ENFORCEMENT_ENABLED`.
 */
export function isTermsEnforcementEnabled(): boolean {
  return process.env.TERMS_ENFORCEMENT_ENABLED !== 'false';
}
