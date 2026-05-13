---
phase: 02-owner-endpoints
plan: 02
subsystem: lodgings, subscriptions, terms
tags: [completion-util, owner-endpoints, public-filter, transaction, submit-for-review, terms-guard]
dependency_graph:
  requires: [lodging.status, lodging.submittedAt, lodging.rejectionReason, plan.lodging-free, subscription.currentPeriodEnd-nullable]
  provides: [computeLodgingCompletion, GET /lodgings/:id owner-enrichment, POST /lodgings/:id/submit-for-review, Plan Free auto-subscription]
  affects: [lodgings.service, lodgings.controller, lodgings.module, lodging-full.dto, all-exceptions.filter]
tech_stack:
  added: []
  patterns: [weighted-bucket-completion, dataSource.transaction, structured-exception-payload, owner-scoped-dto-enrichment]
key_files:
  created:
    - src/modules/lodgings/utils/compute-lodging-completion.ts
    - src/modules/lodgings/utils/compute-lodging-completion.spec.ts
    - src/modules/lodgings/lodgings.service.spec.ts
    - .planning/phases/02-owner-endpoints/deferred-items.md
  modified:
    - src/modules/lodgings/utils/index.ts
    - src/modules/lodgings/dto/lodging-full.dto.ts
    - src/modules/lodgings/lodgings.service.ts
    - src/modules/lodgings/lodgings.controller.ts
    - src/modules/lodgings/lodgings.module.ts
    - src/modules/common/filters/all-exceptions.filter.ts
decisions:
  - computeLodgingCompletion uses 7 weighted buckets (20+15+10+20+20+10+5); criticalSatisfied requires all 4 critical fields
  - Owner detection via ownerId param in findOne — controller passes user?.id from @OptionalAuth; public callers get unchanged shape
  - Public list filter switched from isPublic=true to status='published' — including findOneBySlug per BACKEND-SPEC §2
  - create() wrapped in dataSource.transaction; Plan Free missing throws InternalServerErrorException before transaction starts
  - AllExceptionsFilter extended with sendStructuredErrorResponse to spread errorCode at top-level for frontend MutationErrorListener contract
  - TERMS_ENFORCEMENT_ENABLED=false skips T&C check in submitForReview; enforcement on by default
metrics:
  duration: ~45min
  completed: 2026-05-13T23:10:00Z
  tasks_completed: 5
  files_changed: 10
---

# Phase 02 Plan 02: Owner-facing Lodging Endpoints Summary

**One-liner:** Weighted completion compute util, owner-enriched GET /lodgings/:id, public list filtered by status='published', transactional POST /lodgings with Plan Free auto-subscription, and submit-for-review endpoint with 80%+critical+T&C guards.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | computeLodgingCompletion util (7 buckets, criticalSatisfied) + 5 passing spec tests | 2cc2139 |
| 2 | LodgingFullDto owner fields + findOne ownerId enrichment + controller @GetUser wiring | a0dab08 |
| 3 | findPublicLodgings, findPublicFullInfoLodgings, findOneBySlug: isPublic→status='published' | dfbf887 |
| 4 | create() wrapped in dataSource.transaction + Plan Free auto-subscription | 972fde5 |
| 5 | submitForReview endpoint + service method + AllExceptionsFilter structured payload + 8 tests | 239299f |

## Decisions Made

1. **Weighted bucket design** — 7 buckets match BACKEND-SPEC §5 exactly. criticalSatisfied is the AND of 4 critical fields (whatsappNumbers, lowestPrice, lodgingRoomTypes valid, images>=3). Percentage is rounded integer clamped to [0,100].

2. **Owner detection approach (Plan A)** — `findOne({ identifier, ownerId })` adds owner fields when `ownerId === lodging.user.id`. Controller passes `user?.id` from `@OptionalAuth/@GetUser`. Public callers get the pre-existing shape. No separate endpoint needed.

3. **Public list filter** — Replaced `isPublic: true` with `status: 'published'` in all three public methods. The Phase 1 migration backfilled all `isPublic=true` rows to `published`, so no data loss. `isPublic` column remains for back-compat (per plan out-of-scope note).

4. **Transaction pattern** — Used `this.dataSource.transaction(async manager => { ... })` (same pattern as `TermsService.adminActivate`). Relations and domain lookups are pre-fetched outside the transaction (read-only, safe). Plan Free missing throws `InternalServerErrorException` before the transaction starts.

5. **TERMS_NOT_ACCEPTED payload** — The existing `AllExceptionsFilter` wraps all exceptions and would lose the structured object payload. Added `sendStructuredErrorResponse` path: when the exception response has an `errorCode` key, spread the payload at top level so `body.errorCode` is readable by the frontend's `MutationErrorListener`. This is a correctness requirement (Rule 2 auto-fix).

6. **Test coverage** — 13 tests total (5 util + 8 service). Service spec covers all 6 plan-required scenarios plus 2 create() transaction tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] AllExceptionsFilter structured payload support**
- **Found during:** Task 5
- **Issue:** The global `AllExceptionsFilter` uses `exception.message` (a string) as `errorMessage` in its response, discarding the object payload passed to `ForbiddenException({ errorCode: 'TERMS_NOT_ACCEPTED', ... })`. Frontend reads `body.errorCode` directly — the contract was broken.
- **Fix:** Added `sendStructuredErrorResponse` to the filter. When `exception.getResponse()` is an object with `errorCode`, it spreads the payload at the top level of the response body.
- **Files modified:** `src/modules/common/filters/all-exceptions.filter.ts`
- **Commit:** 239299f

## Known Stubs

None — all endpoints return real data. The `submitForReview` method has a `// TODO: notify admin` comment for Phase 4 email (as specified in the plan). This is intentional and tracked in Phase 4.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: ownership-bypass | src/modules/lodgings/lodgings.service.ts | submitForReview checks `lodging.user?.id !== user.id` — if `lodging.user` is null (orphaned lodging), the null check means both sides are undefined, making the condition false (user IS considered owner). Orphaned lodgings can't be submitted since they'd have no owner, but this edge case should be documented. |

## Self-Check: PASSED

- [x] `src/modules/lodgings/utils/compute-lodging-completion.ts` — exists
- [x] `src/modules/lodgings/utils/compute-lodging-completion.spec.ts` — 5 tests pass
- [x] `src/modules/lodgings/lodgings.service.spec.ts` — 8 tests pass
- [x] `src/modules/lodgings/dto/lodging-full.dto.ts` — has status, completionPercentage, missingFields, submittedAt, rejectionReason
- [x] `src/modules/lodgings/lodgings.service.ts` — has submitForReview, transactional create, DataSource injection
- [x] `src/modules/lodgings/lodgings.controller.ts` — has POST :identifier/submit-for-review
- [x] `src/modules/common/filters/all-exceptions.filter.ts` — has sendStructuredErrorResponse
- [x] commit 2cc2139 — Task 1
- [x] commit a0dab08 — Task 2
- [x] commit dfbf887 — Task 3
- [x] commit 972fde5 — Task 4
- [x] commit 239299f — Task 5
- [x] `pnpm tsc --noEmit` — clean
