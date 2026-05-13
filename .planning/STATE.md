---
status: in_progress
last_activity: 2026-05-13
milestone: v1.1 Lodging Onboarding Backend
current_phase: 2
current_focus: owner-facing-endpoints
---

# State: Binntu Nest Backend

## Current Position

- **Milestone:** v1.1 Lodging Onboarding Backend
- **Phase:** 2 (Owner-facing endpoints) — ready to plan
- **Plan:** none yet (Phase 1 complete)

## Current Focus

Phase 1 complete. Three migrations landed: lodging status workflow, nullable currentPeriodEnd, and lodging-free Plan seed. Next: Phase 2 (submit-for-review endpoint, completionPercentage, public list filter switch, Plan Free auto-subscription on POST /lodgings).

## Recently Completed

- **Phase 1 (2026-05-13):** Migrations + entity updates for lodging status workflow + Plan Free seed
  - `1773000000000-AddLodgingStatusWorkflow` — lodging_status enum, status/submitted_at/rejection_reason cols, backfill legacy → published, index
  - `1773100000000-MakeSubscriptionCurrentPeriodEndNullable` — current_period_end DROP NOT NULL
  - `1773200000000-SeedLodgingFreePlan` — lodging-free Plan seed (idempotent)
  - Lodging entity: status workflow fields added
  - Subscription entity + DTO + service: nullable currentPeriodEnd callers fixed
  - Requirements satisfied: ONB-BE-01, ONB-BE-08

## Decisions

- Milestone driven by frontend Phase 4 wizard already shipped in `binntu` repo
- Phase 4 (frontend) HUMAN-UAT items are blocked on this milestone completing
- All TypeORM-style migrations; pnpm test for verification
- Postgres native enum (CREATE TYPE) for lodging_status — matches terms tables pattern
- currentPeriodEnd=null means lifetime/perpetual (Plan Free); daysRemaining=Infinity, never expires

## Blockers

- None
