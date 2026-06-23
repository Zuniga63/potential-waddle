/**
 * Per-event_type properties allowlist (D-02, Open Question 4) for PII-safe ingestion
 * of the free-form `properties` jsonb. Keys NOT in the allowlist for a given
 * event_type are dropped, which blocks PII smuggling (Pitfall 7 / Ley 1581).
 *
 * Adding a new allowed key is a one-line change here — no migration.
 */
export const EVENT_PROPERTIES_ALLOWLIST: Record<string, string[]> = {
  page_view: ['page_type'],
  whatsapp_click: ['phone_number'],
  phone_click: ['phone_number'],
  web_click: ['url'],
  map_click: [],
  share: ['channel'],
  search_performed: ['query', 'result_count'],
  filter_applied: ['filters', 'result_count'],
  category_viewed: ['category'],
};

/** Hard cap on the serialized size of the sanitized properties object (DoS guard, T-15-08). */
export const MAX_PROPERTIES_SERIALIZED_CHARS = 4096;

/**
 * Pure, synchronous sanitizer. Returns a NEW object containing only the allowlisted
 * keys for the given eventType. Returns `null` when:
 *   - properties is null/undefined/empty,
 *   - nothing remains after allowlist filtering,
 *   - the serialized filtered object exceeds MAX_PROPERTIES_SERIALIZED_CHARS
 *     (caller should log this — it indicates an oversized/abusive payload).
 *
 * No DB, no async — unit-testable in isolation.
 */
export function sanitizeProperties(
  eventType: string,
  properties: Record<string, unknown> | undefined | null,
): Record<string, unknown> | null {
  if (!properties || typeof properties !== 'object' || Object.keys(properties).length === 0) {
    return null;
  }

  const allowedKeys = EVENT_PROPERTIES_ALLOWLIST[eventType] ?? [];
  if (allowedKeys.length === 0) {
    return null;
  }

  const filtered: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(properties, key) && properties[key] !== undefined) {
      filtered[key] = properties[key];
    }
  }

  if (Object.keys(filtered).length === 0) {
    return null;
  }

  if (JSON.stringify(filtered).length > MAX_PROPERTIES_SERIALIZED_CHARS) {
    return null;
  }

  return filtered;
}
