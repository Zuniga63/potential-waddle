---
phase: 03-admin-endpoints
plan: 03
subsystem: lodgings
tags: [admin-endpoints, approve, reject, status-filter, superadmin-guard]
dependency_graph:
  requires: [lodging.status, lodging.submittedAt, lodging.rejectionReason, POST /lodgings/:id/submit-for-review]
  provides: [POST /admin/lodgings/:id/approve, POST /admin/lodgings/:id/reject, GET /admin/lodgings?status=pending_review]
  affects: [lodgings.service, lodgings.module, admin-lodgings-filters.dto, lodging-index.dto]
tech_stack:
  added: []
  patterns: [SuperAdmin-decorator, status-transition-guard, TODO-email-hooks]
key_files:
  created:
    - src/modules/lodgings/admin-lodgings.controller.ts
    - src/modules/lodgings/admin-lodgings.controller.spec.ts
    - src/modules/lodgings/dto/reject-lodging.dto.ts
  modified:
    - src/modules/lodgings/lodgings.service.ts
    - src/modules/lodgings/lodgings.module.ts
    - src/modules/lodgings/dto/admin-lodgings-filters.dto.ts
    - src/modules/lodgings/dto/lodging-index.dto.ts
    - src/modules/lodgings/dto/index.ts
decisions:
  - AdminLodgingsController at @Controller('admin/lodgings') using @SuperAdmin() decorator (bundles JwtAuthGuard + SuperAdminGuard)
  - approve/reject service methods both live in LodgingsService (no separate admin service) — keeps DI simple
  - submittedAt and status added to LodgingIndexDto so AdminLodgingsListDto rows carry them without extra mapping
  - Task 4 (count endpoint) intentionally skipped — FE reuses list endpoint with limit=1 and reads data.total
  - Email hooks left as TODO comments for Phase 4 LodgingNotificationsService
metrics:
  duration: ~4min
  completed: 2026-05-13T22:43:33Z
  tasks_completed: 3
  files_changed: 8
---

# Phase 03 Plan 03: Admin Validation Endpoints Summary

**One-liner:** New `AdminLodgingsController` at `/admin/lodgings` prefix with approve/reject endpoints (status guards, rejection reason persistence, Phase 4 email TODOs) and `?status=` filter + `submittedAt` projection through the admin paginated listing.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | AdminLodgingsController scaffolding + approve service method + module registration + 9 spec tests | 0f04932 |
| 2 | RejectLodgingDto (MinLength 10, MaxLength 1000) + dto index export | 7e67901 |
| 3 | status filter in AdminLodgingsFiltersDto + findAllPaginated query + submittedAt/status in LodgingIndexDto | fc78474 |
| 4 | (skipped — intentional) | — |

## Endpoints Delivered

| Method | URL | Guard | Description |
|--------|-----|-------|-------------|
| GET | /admin/lodgings | SuperAdmin | Paginated list; optional `?status=pending_review` (or draft/published/rejected) |
| POST | /admin/lodgings/:id/approve | SuperAdmin | Transitions `pending_review → published`, clears rejectionReason |
| POST | /admin/lodgings/:id/reject | SuperAdmin | Transitions `pending_review → rejected`, persists reason (min 10 chars) |

## Decisions Made

1. **`@SuperAdmin()` decorator** — used on the controller class (same pattern as `AdminTermsController`). Bundles `JwtAuthGuard + SuperAdminGuard + ApiBearerAuth + swagger responses` via `applyDecorators`. No per-route guard repetition.

2. **No separate admin service** — `approve` and `reject` live in `LodgingsService`. The service is already large but adding a new service would require cross-module imports or duplicating repository injection. Kept co-located.

3. **`submittedAt` and `status` on `LodgingIndexDto`** — rather than a new `AdminLodgingRowDto`, these fields are added directly to `LodgingIndexDto` as optional admin-only fields (same pattern as `ownerHasAcceptedTerms` added in a previous phase). Public endpoints continue to receive these fields but they are documented as admin-only.

4. **Task 4 skipped** — `usePendingLodgingsCount` in the frontend re-uses `listPendingLodgingsService` with `limit: 1` and reads `data.total`. No separate `/admin/lodgings/pending/count` route is needed. Verified in frontend audit.

5. **Email hooks as TODO comments** — `// TODO Phase 4: emailService.notifyLodgingApproved(...)` and `notifyLodgingRejected(...)` placed at the exact call sites in `approve()` and `reject()`. Phase 4 will inject `LodgingNotificationsService` here.

## Deviations from Plan

None — plan executed exactly as written. The `reject` service method was committed in Task 1's commit alongside `approve` (both added to `lodgings.service.ts` in the same edit session); Task 2's commit covers the DTO and barrel export. This is a minor sequencing note, not a deviation.

## Task 4: Why No Count Endpoint

The plan explicitly documents this skip. The frontend `usePendingLodgingsCount` hook calls `listPendingLodgingsService({ status: 'pending_review', limit: 1, page: 1 })` and reads `response.data.count` (the total across all pages, not just the current page). The existing `AdminLodgingsListDto.count` field already exposes this. No separate route is needed.

## Known Stubs

- `// TODO Phase 4: emailService.notifyLodgingApproved(...)` in `LodgingsService.approve()` — intentional, tracked for Phase 4.
- `// TODO Phase 4: emailService.notifyLodgingRejected(...)` in `LodgingsService.reject()` — intentional, tracked for Phase 4.

These stubs do not prevent the plan's goal from being achieved. The endpoints work end-to-end; only email dispatch is deferred.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: missing-ownership-on-admin-actions | src/modules/lodgings/lodgings.service.ts | approve() and reject() do not verify the lodging belongs to any specific tenant. Any super-admin can approve/reject any lodging across all tenants. This is the intended behavior for a global admin panel but should be documented for multi-tenant audit. |

## Self-Check: PASSED

- [x] `src/modules/lodgings/admin-lodgings.controller.ts` — exists, `@Controller('admin/lodgings')`, `@SuperAdmin()`
- [x] `src/modules/lodgings/dto/reject-lodging.dto.ts` — exists, `@MinLength(10)`, `@MaxLength(1000)`
- [x] `src/modules/lodgings/admin-lodgings.controller.spec.ts` — exists, 9 tests
- [x] `src/modules/lodgings/lodgings.service.ts` — has `approve()` and `reject()` methods
- [x] `src/modules/lodgings/dto/admin-lodgings-filters.dto.ts` — has `status` field with `@IsIn([...])`
- [x] `src/modules/lodgings/dto/lodging-index.dto.ts` — has `submittedAt` and `status` fields
- [x] commit 0f04932 — Task 1
- [x] commit 7e67901 — Task 2
- [x] commit fc78474 — Task 3
- [x] `pnpm tsc --noEmit` — clean
- [x] `pnpm test src/modules/lodgings` — 22 tests pass (3 suites)
