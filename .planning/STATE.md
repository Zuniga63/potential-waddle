---
status: in_progress
last_activity: 2026-05-13
milestone: v1.1 Lodging Onboarding Backend
current_phase: 4
current_focus: email-notifications
---

# State: Binntu Nest Backend

## Current Position

- **Milestone:** v1.1 Lodging Onboarding Backend
- **Phase:** 4 (Email notifications) — ready to plan
- **Plan:** none yet (Phase 3 complete)

## Current Focus

Phase 3 complete. Admin approve/reject endpoints landed: AdminLodgingsController at /admin/lodgings with @SuperAdmin() guard, approve/reject service methods with status transition guards and Phase 4 email TODO hooks, status filter through findAllPaginated, and submittedAt/status projected in admin list rows. Next: Phase 4 (email notifications).

## Recently Completed

- **Phase 3 (2026-05-13):** Admin validation endpoints
  - `AdminLodgingsController` at `@Controller('admin/lodgings')` with `@SuperAdmin()` guard
  - `POST /admin/lodgings/:id/approve` — pending_review → published, clears rejectionReason
  - `POST /admin/lodgings/:id/reject` — pending_review → rejected, persists reason (min 10 chars)
  - `GET /admin/lodgings?status=pending_review` — status filter wired through findAllPaginated
  - `LodgingIndexDto` extended with `submittedAt` and `status` for admin list rows
  - `RejectLodgingDto` with `@MinLength(10)` + `@MaxLength(1000)` validation
  - 9 unit tests (3 approve + 3 reject + 3 list); 22 total in module
  - Task 4 (count endpoint) skipped — FE reuses list with limit=1 + data.total
  - Requirements satisfied: ONB-BE-04, ONB-BE-09

- **Phase 2 (2026-05-13):** Owner-facing endpoints for lodging onboarding wizard
  - `computeLodgingCompletion` util — 7 weighted buckets, criticalSatisfied, 5 tests
  - `findOne` enriched with owner-scoped fields (status, completionPercentage, missingFields, submittedAt, rejectionReason)
  - Public list endpoints switched from `isPublic=true` to `status='published'` (findPublicLodgings, findPublicFullInfoLodgings, findOneBySlug)
  - `create()` wrapped in `dataSource.transaction` + Plan Free auto-subscription
  - `POST /lodgings/:id/submit-for-review` with ownership + status + completion + T&C guards
  - `AllExceptionsFilter` extended to spread structured errorCode payloads at top-level (frontend contract)
  - 13 unit tests total (5 util + 8 service)
  - Requirements satisfied: ONB-BE-02, ONB-BE-03, ONB-BE-05, ONB-BE-06, ONB-BE-07

- **Phase 1 (2026-05-13):** Migrations + entity updates for lodging status workflow + Plan Free seed
  - `1773000000000-AddLodgingStatusWorkflow` — lodging_status enum, status/submitted_at/rejection_reason cols, backfill legacy → published, index
  - `1773100000000-MakeSubscriptionCurrentPeriodEndNullable` — current_period_end DROP NOT NULL
  - `1773200000000-SeedLodgingFreePlan` — lodging-free Plan seed (idempotent)
  - Lodging entity: status workflow fields added
  - Subscription entity + DTO + service: nullable currentPeriodEnd callers fixed
  - Requirements satisfied: ONB-BE-01, ONB-BE-08

## Decisions

- Phase 3: @SuperAdmin() decorator used on AdminLodgingsController class (same pattern as AdminTermsController)
- Phase 3: approve/reject in LodgingsService (no separate admin service) — DI simplicity
- Phase 3: submittedAt + status added to LodgingIndexDto as optional admin-only fields (same pattern as ownerHasAcceptedTerms)
- Phase 3: Task 4 count endpoint skipped — FE reads data.total from list endpoint with limit=1
- Milestone driven by frontend Phase 4 wizard already shipped in `binntu` repo
- Phase 4 (frontend) HUMAN-UAT items are blocked on this milestone completing
- All TypeORM-style migrations; pnpm test for verification
- Postgres native enum (CREATE TYPE) for lodging_status — matches terms tables pattern
- currentPeriodEnd=null means lifetime/perpetual (Plan Free); daysRemaining=Infinity, never expires
- computeLodgingCompletion: 7 weighted buckets; criticalSatisfied is AND of 4 critical fields
- Owner detection in GET /lodgings/:id via ownerId param — public callers get unchanged shape
- AllExceptionsFilter structured payload path: when errorCode in exception response, spread at top level
- TERMS_ENFORCEMENT_ENABLED=false skips T&C check in submitForReview

## Blockers

- Pre-existing: `terms.service.spec.ts` fails because DataSource not mocked (added in Phase 1, spec not updated). Tracked in `.planning/phases/02-owner-endpoints/deferred-items.md`.
