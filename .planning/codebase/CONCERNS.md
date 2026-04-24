# Concerns, Technical Debt & Risks

Areas of the codebase that warrant attention — either for future refactoring, risk mitigation, or to factor into planning decisions.

## 1. Oversized Services (SRP violations)

Several services exceed 900 lines and mix multiple responsibilities:

| File | Lines | Concerns |
|------|-------|----------|
| `src/modules/seeds/services/seeds.service.ts` | ~1492 | Parses CSVs, validates, bulk inserts, handles images, manages transactions, emits WebSocket events |
| `src/modules/reviews/services/*.ts` | ~916 combined | Manages review entities across 6 target types with intertwined rating aggregation logic |
| `src/modules/google-places/services/google-places.service.ts` | ~914 | Multi-API integration, caching, fallback, enrichment — unclear priority of fallback chain |

**Impact:** Difficult to test, high risk of regressions on change, poor onboarding.

**Recommendation:** Extract sub-services by responsibility (parser, validator, importer, notifier).

## 2. Inconsistent Error Handling

Observed across 15+ service files:

- **Silent failures** — some `try/catch` blocks return `null` without logging or re-throwing
- **Mixed return signals** — same service may throw `NotFoundException` in one method and return `null` in another for the same "not found" case
- **Exception leakage** — some errors bubble with internal details (stack traces, DB columns) in responses

**Impact:** Callers can't reliably distinguish "not found" from "failure." Observability suffers.

**Recommendation:** Define a module-level error policy — prefer throwing NestJS exceptions; only swallow errors at clear boundaries (external API with documented fallback).

## 3. Missing Transactional Boundaries

**Current state:**
- Delete operations use `queryRunner`/transactions in several modules (reviews, commerce)
- **Create and update operations with multi-entity writes lack transaction wrapping**

**Example risk:** Creating a `Place` that inserts into `places`, `place_images`, and `place_translations` as separate saves — a mid-sequence failure leaves orphans.

**Impact:** Data integrity bugs under load, hard-to-reproduce inconsistencies.

**Recommendation:** Wrap multi-entity writes in `DataSource.transaction(...)` or `queryRunner.startTransaction()`.

## 4. Dependency Versioning Looseness

`package.json` uses caret ranges (`^`) for AI/ML packages that evolve fast:

- `@anthropic-ai/sdk`
- `@google/generative-ai`
- `openai`
- `@langchain/*`
- `@pinecone-database/pinecone`

**Impact:** A fresh `pnpm install` could pull breaking changes. `pnpm-lock.yaml` protects CI, but developers bumping one thing can sweep unintended upgrades.

**Recommendation:** Pin exact versions for AI SDKs; use Renovate/Dependabot for controlled upgrades.

## 5. Security Concerns

### 5a. Admin endpoint validation

- Several admin-only endpoints in `commerce/`, `subscriptions/`, and `seeds/` rely on role guards but lack input boundary checks. Some accept large payloads without size caps.

### 5b. Google OAuth scope

- `auth/` Google strategy does not enforce a domain allowlist — any Google account can authenticate. If the app is intended for specific users (staff, partners), this is a gap.

### 5c. File upload validation

- Cloudinary upload paths (via `cloudinary/`, used across `places`, `reviews`, `experiences`) do not explicitly validate file size / MIME type before transit in all code paths. Cloudinary rejects at ingest, but local DoS vector exists.

### 5d. Error message leakage

- Some `catch` blocks return raw error messages to the client. In production, this could expose DB schema, file paths, or config.

### 5e. Seed operations

- `seeds.service` bulk-mutates data with minimal audit logging. No immutable record of who seeded what and when.

**Recommendation:** Add OWASP-aligned pass: input size limits, rate limits on upload endpoints, sanitized error responses in prod, audit table for seed/admin actions.

## 6. Performance Issues

### 6a. N+1 queries

- Review fetching in `commerce/`, `restaurants/`, `places/` iterates entities and queries reviews per item rather than using a single join/group query.

### 6b. Heavy constructor DI

- Some services inject 11+ repos. This couples many tables to one class and signals the service is doing too much (links to oversized-services concern).

### 6c. Missing DB indexes

- Several frequently filtered columns lack indexes (observed in `reviews`, `places`, `commerce` entities). No confirmed slow-query baseline, but candidates for EXPLAIN analysis.

### 6d. Pinecone vectorization

- Batch embedding calls lack rate limiting and exponential backoff. Under bulk operations (seeds), this can hit API limits or create unbounded retries.

### 6e. Seed service memory

- `seeds.service` reads large files into memory then iterates. Streaming would reduce peak memory for large imports.

## 7. Fragile Components

### Seed Service — `src/modules/seeds/services/seeds.service.ts`

- 1492 lines
- Handles: CSV/JSON parsing, validation, bulk insert, image upload, transactions, WebSocket notifications, error recovery
- **High blast radius** — any change risks breaking imports across all entity types
- Not covered by tests

### Reviews Service — `src/modules/reviews/`

- 916 lines across services
- Manages reviews for 6 target types (places, restaurants, lodgings, experiences, guides, transport) with per-type rating logic
- Rating recalculation touches the parent entity on every review write — contention risk

### Google Places Integration — `src/modules/google-places/services/google-places.service.ts`

- 914 lines
- Multiple external API dependencies (Places API, possibly legacy + new versions)
- Unclear fallback priority when APIs disagree
- Cost implications — Places API calls are billed

### Image Management (duplicated logic)

- Cloudinary upload/delete logic repeated across `places`, `restaurants`, `lodgings`, `reviews` services
- Risk of orphaned files when entity delete fails after upload
- No centralized image-lifecycle service

## 8. Test Coverage Gaps

See `TESTING.md`. Relevant for planning:

- **Zero meaningful test coverage** — only 4 scaffold spec files
- Critical flows untested: auth, payments, seed, reviews math
- No integration tests for external services (Cloudinary, Pinecone, AI providers)
- No transaction rollback tests

## 9. Documentation State

- `README.md` — basic setup only (~6KB)
- `docs/` — contains scattered design notes; not indexed
- **No API documentation beyond Swagger auto-gen** — business rules (rating algorithm, tenant isolation model, seed import format) not written down

**Impact:** New contributors lose time discovering implicit contracts.

## 10. Tenant Model

- `tenant/` module and tenant-aware interceptor exist
- **Not all queries appear to enforce tenant filtering consistently**
- A missing `WHERE tenantId = ?` on a raw QueryBuilder could leak cross-tenant data

**Recommendation:** Audit every QueryBuilder call for tenant scoping. Consider a TypeORM subscriber or custom repository that enforces it.

## 11. Migration Hygiene

- Migrations in `src/migrations/` — timestamp-prefixed, generated by TypeORM CLI
- No explicit check that migrations are idempotent or rollback-tested
- Some migrations likely contain raw SQL for complex changes — review before running in production

## 12. Environment / Secrets Management

- `.env` file in repo root (gitignored ✓)
- `.env.example` present — good onboarding
- Joi validation (`src/config/joi-validation.schema.ts`) ensures required vars exist at boot ✓
- **No secret rotation process documented**
- Secrets used: DB credentials, JWT secret, Google OAuth, multiple AI API keys, Cloudinary, Resend, Tinify, Turnstile, Pinecone

## Summary / Prioritization

**High priority (security / data integrity):**
1. Transactional boundaries on multi-entity writes (#3)
2. Tenant scoping audit (#10)
3. Admin endpoint input validation (#5a)
4. Google OAuth domain allowlist (#5b)

**Medium priority (reliability / perf):**
5. Refactor seed service (#1, #7)
6. Add N+1 query fixes + DB indexes (#6a, #6c)
7. Standardize error handling policy (#2)
8. Centralize image lifecycle (#7)

**Lower priority (maintainability):**
9. Pin AI SDK versions (#4)
10. Document business rules (#9)
11. Build test infrastructure, then tests for critical paths (#8)
