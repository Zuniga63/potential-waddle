---
phase: 01-lodging-status-workflow
plan: 01
requirements: [ONB-BE-01, ONB-BE-08]
status: planned
parallelization: false
autonomous: true
---

# Plan 01: Lodging Status Workflow + Plan Free Seed

## Objective

Add the lodging status workflow state machine and seed the `lodging-free` Plan that Phase 2 will auto-assign on lodging creation. Make `Subscription.currentPeriodEnd` nullable so Free (perpetual) subscriptions are representable.

## Context

- The frontend Phase 4 wizard at `binntu` repo expects `Lodging` to expose a `status: 'draft' | 'pending_review' | 'published' | 'rejected'` field.
- Legacy lodgings (already in DB) MUST remain visible — backfill them to `status='published'`.
- Plan Free is `lodging-free` with `priceInCents: 0`, `billingInterval: 'lifetime'`, `isActive: true`.
- Migration timestamps use `Date.now()` style epochs (e.g., `1772000000000`). Next slot: `1773000000000`.
- All migrations are reversible (`up` + `down`).

## Tasks

### Task 1: Migration — add status workflow columns to Lodging + backfill legacy rows

**Files:**
- `src/migrations/1773000000000-AddLodgingStatusWorkflow.ts` (new)

**Behavior:**
- `up`: 
  1. Create a Postgres enum type `lodging_status` with values `draft`, `pending_review`, `published`, `rejected`.
  2. `ALTER TABLE "lodging" ADD COLUMN "status" lodging_status NOT NULL DEFAULT 'draft'`.
  3. `UPDATE "lodging" SET "status" = 'published'` (backfill ALL existing rows — they were already visible via isPublic and must stay visible).
  4. `CREATE INDEX "IDX_lodging_status" ON "lodging" ("status")`.
  5. `ALTER TABLE "lodging" ADD COLUMN "submitted_at" timestamp NULL`.
  6. `ALTER TABLE "lodging" ADD COLUMN "rejection_reason" text NULL`.
- `down`: reverse — drop index, drop columns, drop enum type. Order: drop index → drop columns → drop type.

**Acceptance:**
- Migration file follows naming convention `{epoch}-{PascalCaseName}.ts`
- `up` is idempotent-safe enough for fresh runs (use raw SQL, not TypeORM schema sync)
- `down` cleanly reverts

### Task 2: Migration — make Subscription.currentPeriodEnd nullable

**Files:**
- `src/migrations/1773100000000-MakeSubscriptionCurrentPeriodEndNullable.ts` (new)

**Behavior:**
- `up`: `ALTER TABLE "subscriptions" ALTER COLUMN "current_period_end" DROP NOT NULL`
- `down`: `ALTER TABLE "subscriptions" ALTER COLUMN "current_period_end" SET NOT NULL`

**Acceptance:**
- Existing subscription rows are NOT affected (they all have non-null values today)
- New Plan Free subscriptions (Phase 2) can persist with `currentPeriodEnd: null`

### Task 3: Migration — seed Plan Free (lodging-free)

**Files:**
- `src/migrations/1773200000000-SeedLodgingFreePlan.ts` (new)

**Behavior:**
- `up`: INSERT a Plan row with:
  - `name`: 'Plan Free Lodging'
  - `slug`: 'lodging-free'
  - `description`: 'Plan gratuito perpetuo para alojamientos'
  - `priceInCents`: 0
  - `currency`: 'COP'
  - `billingInterval`: 'lifetime'
  - `isActive`: true
  - `sortOrder`: 0
  - Use `ON CONFLICT (slug) DO NOTHING` so re-runs are safe.
- `down`: `DELETE FROM "plans" WHERE "slug" = 'lodging-free'`

**Acceptance:**
- After `pnpm migration:run`, `SELECT * FROM plans WHERE slug='lodging-free'` returns exactly 1 row
- The seed migration is idempotent (re-run = no duplicates)

### Task 4: Update TypeORM entities to reflect schema changes

**Files:**
- `src/modules/lodgings/entities/lodging.entity.ts` (modify)
- `src/modules/subscriptions/entities/subscription.entity.ts` (modify)

**Behavior:**
- `Lodging` entity:
  - Add column property: `status: 'draft' | 'pending_review' | 'published' | 'rejected'` mapped as `@Column('enum', { enum: [...], default: 'draft', enumName: 'lodging_status' })` (or use string union depending on TypeORM enum convention in repo)
  - Add `submittedAt: Date | null` (`@Column('timestamp', { name: 'submitted_at', nullable: true })`)
  - Add `rejectionReason: string | null` (`@Column('text', { name: 'rejection_reason', nullable: true })`)
  - Place properties in a new commented section `// * STATUS WORKFLOW` after the `MAIN FIELDS` block, before `// * isPublic`
- `Subscription` entity:
  - Change `currentPeriodEnd: Date` to `currentPeriodEnd: Date | null`
  - Add `nullable: true` to the decorator

**Acceptance:**
- `pnpm tsc --noEmit` clean
- No callers of `currentPeriodEnd` break (search and fix any non-null asserters)
- Entity properties align with the migration column names

### Task 5: Verify migrations run cleanly + entities load

**Behavior:**
- Run `pnpm migration:run` (or document the command if the dev DB is not running locally — must succeed in CI)
- If unable to run locally, at minimum confirm `pnpm tsc --noEmit` and `pnpm build` succeed (TypeORM schema sync would catch entity/column mismatches at build time only if `synchronize: true`, which it isn't — but the build still type-checks)
- Run `pnpm test src/modules/lodgings src/modules/subscriptions` (only if these modules have tests; otherwise note as N/A)

**Acceptance:**
- Build succeeds
- No type errors in modified files or their consumers

## Verification

- Migration timestamps in numeric order (`1773000000000` < `1773100000000` < `1773200000000`)
- All migrations reversible (`up` ↔ `down`)
- Legacy lodgings preserved (`SELECT count(*) WHERE status != 'published'` should be 0 after backfill on a fresh DB with legacy data)
- Plan `lodging-free` exists exactly once

## Out of Scope

- Adding any new endpoints (Phase 2)
- The `is_default` boolean column on Plan (deferred per BACKEND-SPEC §8 as optional)
- Any service-layer changes (Phase 2)
