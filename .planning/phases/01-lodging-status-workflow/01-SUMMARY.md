---
phase: 01-lodging-status-workflow
plan: 01
subsystem: lodgings, subscriptions
tags: [migration, entity, status-workflow, plan-free]
dependency_graph:
  requires: []
  provides: [lodging.status, lodging.submittedAt, lodging.rejectionReason, plan.lodging-free, subscription.currentPeriodEnd-nullable]
  affects: [subscriptions.service, subscriptions.dto]
tech_stack:
  added: []
  patterns: [postgres-native-enum, nullable-column-migration, idempotent-seed]
key_files:
  created:
    - src/migrations/1773000000000-AddLodgingStatusWorkflow.ts
    - src/migrations/1773100000000-MakeSubscriptionCurrentPeriodEndNullable.ts
    - src/migrations/1773200000000-SeedLodgingFreePlan.ts
  modified:
    - src/modules/lodgings/entities/lodging.entity.ts
    - src/modules/subscriptions/entities/subscription.entity.ts
    - src/modules/subscriptions/dto/subscription.dto.ts
    - src/modules/subscriptions/services/subscriptions.service.ts
decisions:
  - Use Postgres native enum (CREATE TYPE lodging_status) matching the terms migration pattern in this repo
  - currentPeriodEnd=null means lifetime/perpetual — never expires; daysRemaining=Infinity for Plan Free
  - Backfill UPDATE sets ALL existing lodgings to published (they were visible via isPublic)
  - Plan Free seed uses ON CONFLICT (slug) DO NOTHING for idempotency across re-runs
metrics:
  duration: ~15min
  completed: 2026-05-13T22:17:52Z
  tasks_completed: 5
  files_changed: 7
---

# Phase 1 Plan 01: Lodging Status Workflow + Plan Free Seed Summary

**One-liner:** Postgres enum status column on Lodging with legacy backfill to `published`, nullable `currentPeriodEnd` on Subscription, and seeded `lodging-free` Plan via three reversible migrations.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Migration: add lodging_status enum + status/submitted_at/rejection_reason cols, backfill, index | 3f8bef8 |
| 2 | Migration: make subscriptions.current_period_end nullable | 3f8bef8 |
| 3 | Migration: seed lodging-free Plan (idempotent) | 3f8bef8 |
| 4 | Update Lodging + Subscription entities + fix nullable callers in DTO and service | 580fb8a |
| 5 | Verify: pnpm tsc --noEmit clean; tests N/A (no test files in these modules) | — |

## Migrations

| Timestamp | File | Purpose |
|-----------|------|---------|
| 1773000000000 | AddLodgingStatusWorkflow | Postgres enum type + 3 columns + backfill + index |
| 1773100000000 | MakeSubscriptionCurrentPeriodEndNullable | DROP NOT NULL on current_period_end |
| 1773200000000 | SeedLodgingFreePlan | INSERT lodging-free Plan, idempotent |

All migrations have working `up` and `down`.

## Decisions Made

1. **Postgres native enum** — followed the pattern from `1771000000000-CreateTermsTables.ts` which uses `CREATE TYPE "public"."terms_type_enum" AS ENUM (...)`. The `lodging.entity.ts` decorator uses `@Column('enum', { enumName: 'lodging_status' })` to reference it.

2. **`currentPeriodEnd: null` = perpetual** — Plan Free lifetime subscriptions have no end date. `null` is the semantic representation. The DTO's `isExpired` guard treats `null` as "never expires"; `daysRemaining` returns `Infinity`. The service's expiry check skips when `currentPeriodEnd` is null.

3. **Backfill strategy** — `UPDATE "lodging" SET "status" = 'published'` (no WHERE) is intentional: all pre-existing rows were visible via `isPublic=true` and must stay visible after the migration. New rows default to `'draft'`.

4. **Seed idempotency** — `ON CONFLICT ("slug") DO NOTHING` ensures re-running the migration on a DB that already has the row is safe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed non-null callers of currentPeriodEnd in SubscriptionDto and SubscriptionsService**
- **Found during:** Task 4
- **Issue:** Making `currentPeriodEnd` nullable on the entity caused type errors in `subscription.dto.ts` (lines 74-76 used `.getTime()` without null guard) and `subscriptions.service.ts` (line 67 compared `new Date() > subscription.currentPeriodEnd` without null guard).
- **Fix:** Added `!== null` guards. `isExpired` is `false` when `currentPeriodEnd` is null (lifetime). `daysRemaining` is `Infinity`. Service expiry check skips for null.
- **Files modified:** `src/modules/subscriptions/dto/subscription.dto.ts`, `src/modules/subscriptions/services/subscriptions.service.ts`
- **Commit:** 580fb8a

## Tests

No test files exist under `src/modules/lodgings/` or `src/modules/subscriptions/` — noted as N/A in the plan. `pnpm tsc --noEmit` passes clean.

## Known Stubs

None — all migrations and entity changes are complete and functional.

## Threat Flags

None — migrations are schema-only with no new network endpoints or auth paths introduced.

## Self-Check: PASSED

- [x] `src/migrations/1773000000000-AddLodgingStatusWorkflow.ts` — exists
- [x] `src/migrations/1773100000000-MakeSubscriptionCurrentPeriodEndNullable.ts` — exists
- [x] `src/migrations/1773200000000-SeedLodgingFreePlan.ts` — exists
- [x] `src/modules/lodgings/entities/lodging.entity.ts` — has status/submittedAt/rejectionReason
- [x] `src/modules/subscriptions/entities/subscription.entity.ts` — currentPeriodEnd is Date | null
- [x] commit 3f8bef8 — exists (migrations)
- [x] commit 580fb8a — exists (entities + callers)
- [x] `pnpm tsc --noEmit` — clean
