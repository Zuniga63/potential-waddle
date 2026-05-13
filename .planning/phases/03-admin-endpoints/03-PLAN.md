---
phase: 03-admin-endpoints
plan: 03
requirements: [ONB-BE-04, ONB-BE-09]
status: planned
parallelization: false
autonomous: true
---

# Plan 03: Admin Validation Endpoints

## Objective

Wire the admin side of the lodging onboarding workflow: approve/reject endpoints (with rejection reason persistence and notification hooks) and a paginated pending-review listing with `submittedAt` exposed. Both endpoints require admin role.

## Context

- Phase 1 added `status` enum + `submitted_at` + `rejection_reason` columns.
- Phase 2 added the `submit-for-review` endpoint that transitions lodgings to `pending_review`.
- The frontend admin pages at `/admin/lodgings/pending` and the validation panel are already built — they hit these exact endpoints (`POST /admin/lodgings/:id/approve`, `POST /admin/lodgings/:id/reject`, `GET /admin/lodgings?status=pending_review`).
- The repo already has admin auth via `SuperAdminGuard` (used by `terms` admin endpoints). Reuse it.
- The existing `GET /lodgings/admin/list` returns an admin listing — extend or add a sibling endpoint for the pending filter, depending on what's cleanest.
- Phase 4 will wire actual emails — for now, leave hook calls as stubs (TODO comments or method calls to a future `LodgingNotificationsService` that doesn't exist yet). DO NOT implement email send here.

## Tasks

### Task 1: AdminLodgingsController scaffolding + approve endpoint + service method + tests

**IMPORTANT — URL contract from FE audit:** Frontend uses these URLs:
- `GET ${API_URL}/admin/lodgings?status=pending_review` (with pagination params)
- `POST ${API_URL}/admin/lodgings/:id/approve`
- `POST ${API_URL}/admin/lodgings/:id/reject` (body: `{ reason: string }`)

Existing backend has `GET /lodgings/admin/list` — DIFFERENT prefix. Backend MUST switch to FE's expected `/admin/lodgings` prefix. Create a new dedicated controller.

**Files:**
- `src/modules/lodgings/admin-lodgings.controller.ts` (new — `@Controller('admin/lodgings')`)
- `src/modules/lodgings/lodgings.module.ts` (register new controller in `controllers: []`)
- `src/modules/lodgings/lodgings.service.ts` (add `approve` method)
- `src/modules/lodgings/admin-lodgings.controller.spec.ts` (tests)

**Controller scaffolding:**
```typescript
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard'; // confirm path
import { LodgingsService } from './lodgings.service';
import { AdminLodgingsFiltersDto } from './dto/admin-lodgings-filters.dto';
import { RejectLodgingDto } from './dto/reject-lodging.dto';

@Controller('admin/lodgings')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminLodgingsController {
  constructor(private readonly lodgingsService: LodgingsService) {}

  @Get()
  list(@Query() filters: AdminLodgingsFiltersDto) {
    return this.lodgingsService.findAllPaginated(filters);
  }

  @Post(':identifier/approve')
  approve(@Param('identifier') identifier: string) {
    return this.lodgingsService.approve({ identifier });
  }

  @Post(':identifier/reject')
  reject(@Param('identifier') identifier: string, @Body() body: RejectLodgingDto) {
    return this.lodgingsService.reject({ identifier, reason: body.reason });
  }
}
```

**Service method `approve({ identifier })`:**
1. Load lodging.
2. If not found → `NotFoundException`.
3. If `status !== 'pending_review'` → `BadRequestException('Only pending_review lodgings can be approved')` (include current status in payload).
4. Update: `status = 'published'`, `rejectionReason = null` (clear any stale reason in case the lodging was previously rejected then re-submitted). Save.
5. Hook: log a TODO/comment for the approval email — `// TODO Phase 4: emailService.notifyLodgingApproved(lodging.user.email, lodging.id)`.
6. Return the updated lodging (owner-view shape with completion fields).

**Tests:**
- Approve happy path → status transitions to published, rejectionReason cleared, return shape correct.
- Lodging not found → 404.
- Status != pending_review (e.g., draft) → 400 with payload mentioning current status.

**Acceptance:**
- 3 tests pass.
- Endpoint protected by `JwtAuthGuard + SuperAdminGuard` (verify decorator order matches existing admin endpoints).
- `pnpm tsc --noEmit` clean.

### Task 2: reject endpoint — DTO + service method + tests

The endpoint itself is already declared on `AdminLodgingsController` in Task 1's scaffolding. This task fills in the DTO and service-side logic + tests.

**Files:**
- `src/modules/lodgings/dto/reject-lodging.dto.ts` (new — body validation)
- `src/modules/lodgings/dto/index.ts` (export new DTO)
- `src/modules/lodgings/lodgings.service.ts` (add `reject` method)
- `src/modules/lodgings/admin-lodgings.controller.spec.ts` (extend with reject tests, or co-located)

**DTO `RejectLodgingDto`:**
```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejectLodgingDto {
  @IsString()
  @MinLength(10, { message: 'reason must be at least 10 characters' })
  @MaxLength(1000)
  reason: string;
}
```

**Service method `reject({ identifier, reason })`:**
1. Load lodging.
2. If not found → `NotFoundException`.
3. If `status !== 'pending_review'` → `BadRequestException('Only pending_review lodgings can be rejected')`.
4. Update: `status = 'rejected'`, `rejectionReason = reason`, `submittedAt` left as-is so the user can see when they last submitted. Save.
5. Hook: TODO comment for rejection email — `// TODO Phase 4: emailService.notifyLodgingRejected(lodging.user.email, lodging.id, reason)`.
6. Return updated lodging (owner-view shape).

**Tests:**
- Reject happy path → status='rejected', rejectionReason persisted, return shape correct.
- Lodging not found → 404.
- Status != pending_review → 400.
- Reason shorter than 10 chars → `BadRequestException` from class-validator (or DTO-level rejection, depending on pipeline) — confirm via integration-style test or skip if not testable in unit and document.

**Acceptance:**
- 3+ tests pass.
- DTO validates min(10) reason length.
- `pnpm tsc --noEmit` clean.

### Task 3: paginated list endpoint with status filter + submittedAt + tests

The `GET /admin/lodgings` endpoint already exists on `AdminLodgingsController` (Task 1). This task ensures the `status` filter and `submittedAt` field are wired through.

**FE audit confirmed:** `listPendingLodgingsService` hits `GET ${API_URL}/admin/lodgings?status=pending_review&page=N&limit=M`. The count hook uses the same endpoint with `limit: 1` and reads `total` (so NO separate count endpoint is needed).

**Files:**
- `src/modules/lodgings/dto/admin-lodgings-filters.dto.ts` (modify — add optional `status` filter)
- `src/modules/lodgings/dto/admin-lodgings-list.dto.ts` (modify — add `submittedAt` to row shape)
- `src/modules/lodgings/lodgings.service.ts` (modify `findAllPaginated` — apply status filter, project submittedAt)
- `src/modules/lodgings/admin-lodgings.controller.spec.ts` (extend with list tests)

**Behavior:**
- Add `status?: 'draft' | 'pending_review' | 'published' | 'rejected'` to `AdminLodgingsFiltersDto` with `@IsOptional()` + `@IsIn(...)`.
- In `findAllPaginated`, apply the filter conditionally on the QueryBuilder when `filters.status` is present.
- Include `submittedAt` in the admin row DTO and project it from the query (`addSelect`/select).
- Pagination already works via the existing DTO — just confirm `total` is correct when filtered.

**Tests:**
- Pending list (`?status=pending_review`) returns only `status='pending_review'` rows.
- Each row includes `submittedAt`.
- Pagination metadata (`total`, `hasMore`, `page`) reflects the filtered total.
- Without `?status=`, behavior matches existing tests (no regression).

**Acceptance:**
- Frontend URL contract honored: `GET /admin/lodgings?status=pending_review&page=1&limit=20` works.
- 3+ tests pass.
- `pnpm tsc --noEmit` clean.

### Task 4: (skipped — FE uses the list endpoint for count)

The FE's `usePendingLodgingsCount` hook reuses `listPendingLodgingsService` with `limit: 1` and selects `data.total`. No separate count endpoint needed. Document this in SUMMARY.md so future-you knows why there's no `/admin/lodgings/pending/count` route.

## Verification

- All new endpoints protected by SuperAdminGuard.
- Frontend admin pages (already built in `binntu` repo) can call these URLs without any FE changes.
- `pnpm tsc --noEmit` clean.
- `pnpm test src/modules/lodgings` passes (existing + new tests, no regressions).

## Out of Scope

- Email notifications (Phase 4 wires the actual hooks; this phase leaves TODOs).
- Bulk approve/reject (single-lodging only).
- Reject "undo" or re-approve flow (rejected lodging can be re-submitted via `submit-for-review` from Phase 2, which already handles status='rejected' as a valid source state).
