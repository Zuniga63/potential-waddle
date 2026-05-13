---
phase: 02-owner-endpoints
plan: 02
requirements: [ONB-BE-02, ONB-BE-03, ONB-BE-05, ONB-BE-06, ONB-BE-07]
status: planned
parallelization: false
autonomous: true
---

# Plan 02: Owner-facing Lodging Endpoints

## Objective

Wire the owner-facing backend that the wizard consumes: computed completion percentage + missing fields, public-list filter switch, Plan Free auto-subscription on draft creation, and the `submit-for-review` endpoint with T&C + 80% guards.

## Context

- Phase 1 landed the schema: `Lodging.status`, `submittedAt`, `rejectionReason`; Plan `lodging-free` seeded; `Subscription.currentPeriodEnd` nullable.
- `TermsContextEnum.LodgingCreation = 'lodging_creation'` already exists.
- `TermsService.getStatusForUser(userId)` returns a `TermsStatusDto` with per-type booleans — use it (or a more direct query) to check if the user has accepted the active `lodging` T&C.
- Existing `LodgingsService` methods: `findAll`, `findAllPaginated`, `findPublicLodgings`, `findPublicFullInfoLodgings`, `findOne`, `findOneBySlug`, `create`, `update`, `delete`, `updateVisibility`, etc.
- Migration timestamps already used: `1773000000000` (lodging status), `1773100000000` (subscription nullable), `1773200000000` (lodging-free seed). No further migrations needed in this phase.

## Tasks

### Task 1: completion compute utility + unit tests

**Files:**
- `src/modules/lodgings/utils/compute-lodging-completion.ts` (new)
- `src/modules/lodgings/utils/compute-lodging-completion.spec.ts` (new)
- `src/modules/lodgings/utils/index.ts` (may need to be created or extended — check existing utils dir; if no index, create one)

**Behavior:**

Export `computeLodgingCompletion(lodging: Lodging): { completionPercentage: number; missingFields: string[]; criticalSatisfied: boolean }`.

**Weighted buckets per BACKEND-SPEC §5:**
| Bucket | Weight | Fields | Critical |
|--------|--------|--------|----------|
| Información básica | 20 | `name`, `description` (>=50 chars), `townId` (or `town.id`), `address`, `categories` (>=1) | No |
| Contacto | 15 | `whatsappNumbers` (>=1) ★, `email OR phoneNumbers (>=1)` | whatsappNumbers ★ |
| Precio | 10 | `lowestPrice` (>0) ★ | lowestPrice ★ |
| Habitaciones | 20 | `lodgingRoomTypes` (>=1 with name + price + maxCapacity) ★ | lodgingRoomTypes ★ |
| Fotos | 20 | `images` (>=3) ★ | images>=3 ★ |
| Servicios | 10 | >=1 amenity AND >=1 facility AND >=1 paymentMethod | No |
| Ubicación | 5 | `location` (PostGIS point non-null) | No |

**Rules:**
- For each bucket, count satisfied sub-conditions / total → bucket %; multiply by bucket weight; sum.
- `completionPercentage` is the rounded integer total (0-100). Clamp to [0, 100].
- `missingFields` is a flat string array of slugs naming what's missing — e.g., `["description", "whatsappNumbers", "lowestPrice", "lodgingRoomTypes", "images", "amenities", "location"]`. Use field-name slugs the frontend already recognizes (look at the FE wizard's `missingFields` consumer to align).
- `criticalSatisfied` is true iff ALL ★ critical fields meet their thresholds (whatsappNumbers>=1, lowestPrice>0, lodgingRoomTypes>=1 valid, images>=3). Submit-for-review uses this AS WELL AS the 80% threshold.

**Tests:** Cover:
1. Empty/fresh draft → completionPercentage near 0, missingFields populated with all expected slugs, criticalSatisfied=false
2. Fully complete lodging → completionPercentage=100, missingFields=[], criticalSatisfied=true
3. 80% complete but missing one critical (e.g., images=2) → criticalSatisfied=false, completionPercentage<100
4. Description shorter than 50 chars → `description` in missingFields
5. Has email but no phoneNumbers and no whatsappNumbers → whatsappNumbers in missingFields (critical) but Contact bucket gets partial credit because email satisfies the OR sub-condition

**Acceptance:**
- All 5 tests pass: `pnpm test src/modules/lodgings/utils/compute-lodging-completion.spec.ts`
- `pnpm tsc --noEmit` clean

### Task 2: surface completion fields on owner-scoped GET /lodgings/:id

**Files:**
- `src/modules/lodgings/dto/lodging-full.dto.ts` (modify — add fields)
- `src/modules/lodgings/lodgings.service.ts` (modify — extend `findOne` or add new method)
- `src/modules/lodgings/lodgings.controller.ts` (modify — wire owner-aware response)

**Behavior:**
- The existing `findOne({ identifier })` returns a public-style shape today. Owner-scoped reads need `completionPercentage` and `missingFields` added.
- Two viable approaches — pick the simpler:
  - **A. Owner detection in controller:** the controller's `@Get(':identifier')` already accepts an optional User (or has access via `@GetUser()`). When the requesting user is the owner of the lodging, compute and attach `completionPercentage` + `missingFields` + `status` + `submittedAt` + `rejectionReason` to the response. Public callers get the existing shape (no completion fields).
  - **B. Dedicated endpoint:** Add `@Get(':identifier/owner-view')` with `@UseGuards(JwtAuthGuard)` that returns the enriched shape. Frontend hits this for the wizard's `useLodgingOnboardingDetail` hook. Public callers continue using `@Get(':identifier')`.
- **Pick A** — keeps the frontend's existing `getLodgingOnboardingDetailService` URL (`GET /lodgings/:id`) working without changes, and is what the frontend already expects per Plan 04-05 of the wizard.

**DTO change:** Add optional fields to `LodgingFullDto`:
```typescript
@ApiProperty({ required: false })
status?: 'draft' | 'pending_review' | 'published' | 'rejected';

@ApiProperty({ required: false, type: Number })
completionPercentage?: number;

@ApiProperty({ required: false, type: [String] })
missingFields?: string[];

@ApiProperty({ required: false, type: Date, nullable: true })
submittedAt?: Date | null;

@ApiProperty({ required: false, type: String, nullable: true })
rejectionReason?: string | null;
```

**Service change:** Update `findOne` (or wrap it) so that when called with an `ownerId` argument, the response includes the new fields populated; when `ownerId` is undefined or mismatches `lodging.user?.id`, fields are omitted (or `undefined`).

**Acceptance:**
- Existing public callers still get the old shape (no breakage).
- Owner request returns `completionPercentage`, `missingFields`, `status`, `submittedAt`, `rejectionReason`.
- `pnpm tsc --noEmit` clean.

### Task 3: switch public list endpoints to filter by status='published'

**Files:**
- `src/modules/lodgings/lodgings.service.ts` (modify — `findPublicLodgings`, `findPublicFullInfoLodgings`)

**Behavior:**
- Both methods currently filter by `isPublic = true`. Change them to filter by `status = 'published'` (drop the `isPublic` filter, or keep both ANDed if helpful for transition — prefer drop since the migration backfilled all `isPublic=true` rows to `status='published'`).
- The `findOneBySlug` method is also publicly accessible (no auth); audit it — if it filters by `isPublic`, switch to `status='published'`. If it doesn't filter at all (public detail page expects to fetch any lodging by slug regardless of status), DOUBLE-CHECK: should an unpublished lodging be retrievable via slug? Per BACKEND-SPEC §2, public endpoints filter by `status='published'`. Apply the same filter here.

**Acceptance:**
- Existing tests (if any) for public list endpoints still pass.
- `pnpm tsc --noEmit` clean.
- Manual check: a lodging with `status='draft'` would NOT appear in `GET /lodgings/public`.

### Task 4: wrap POST /lodgings in transaction + auto-create Plan Free subscription

**Files:**
- `src/modules/lodgings/lodgings.service.ts` (modify `create`)
- `src/modules/lodgings/lodgings.module.ts` (may need to import SubscriptionsModule or inject Subscription repo)
- May need: `src/modules/subscriptions/subscriptions.module.ts` to export the Subscription repo (check current state)

**Behavior:**
- Wrap `LodgingsService.create()` in a `dataSource.transaction(async manager => { ... })` block (or use the existing QueryRunner pattern if the repo prefers).
- Inside the transaction:
  1. Save the new Lodging row (status defaults to `draft` from migration default).
  2. Lookup the `lodging-free` Plan by slug (`planRepository.findOne({ where: { slug: 'lodging-free' } })`).
  3. Create a Subscription with:
     - `userId` = the creating user
     - `planId` = looked-up Plan ID
     - `entityType` = `'lodging'`
     - `entityId` = newly created lodging ID
     - `entityName` = lodging name
     - `status` = `'active'`
     - `currentPeriodStart` = now
     - `currentPeriodEnd` = `null` (lifetime)
  4. If either save fails, the transaction rolls back.
- If the Plan `lodging-free` is missing (someone ran the migration without seed, or seed failed), throw `InternalServerErrorException('Plan Free not seeded')` — this is a critical setup error.

**Acceptance:**
- New unit test: `create()` happy path → Lodging persisted + Subscription persisted, both visible after transaction commits.
- New unit test: simulate Plan Free missing → throws 500, neither row persisted.
- `pnpm tsc --noEmit` clean.

### Task 5: POST /lodgings/:id/submit-for-review endpoint + guards

**Files:**
- `src/modules/lodgings/lodgings.controller.ts` (modify — add endpoint)
- `src/modules/lodgings/lodgings.service.ts` (modify — add `submitForReview` method)
- (No new module imports likely needed beyond what Phase 1 + Task 4 set up; TermsModule is already imported per the audit.)

**Behavior:**

Controller:
```typescript
@Post(':identifier/submit-for-review')
@UseGuards(JwtAuthGuard)
submitForReview(@Param('identifier') identifier: string, @GetUser() user: User) {
  return this.lodgingsService.submitForReview({ identifier, user });
}
```

Service method `submitForReview({ identifier, user })`:
1. Load lodging by id/slug with `user` relation.
2. If `lodging.user.id !== user.id` → `ForbiddenException('Not your lodging')`.
3. If `lodging.status !== 'draft' && lodging.status !== 'rejected'` → `BadRequestException({ message: 'INVALID_STATUS', detail: 'Only draft or rejected lodgings can be submitted' })`.
4. Compute completion via Task 1 util. If `completionPercentage < 80 || !criticalSatisfied` → `BadRequestException({ errorCode: 'INCOMPLETE', completionPercentage, missingFields })`.
5. Check T&C: if `isTermsEnforcementEnabled()` is true AND user has NOT accepted active `lodging` T&C → throw `ForbiddenException` with payload `{ errorCode: 'TERMS_NOT_ACCEPTED', termsType: 'lodging', activeTermsId: <uuid> }`. **MUST match the exact error code the frontend's `MutationErrorListener` filters on (`errorCode === 'TERMS_NOT_ACCEPTED'`).**
6. If `TERMS_ENFORCEMENT_ENABLED` is false, skip step 5.
7. Update lodging: `status = 'pending_review'`, `submittedAt = new Date()`, `rejectionReason = null` (clear any prior rejection). Save.
8. Return updated lodging (with the same owner-view shape from Task 2 so the frontend can update its query cache).
9. Hook for admin-pending email (Phase 4 will wire) — for now, leave a TODO comment or call a stub method on a future `LodgingNotificationsService`. Do NOT implement the email yet.

**Tests:**
- `submitForReview` happy path → status transitions, submittedAt set, returns enriched lodging.
- Non-owner → ForbiddenException.
- Status='published' → BadRequestException with `INVALID_STATUS`.
- completionPercentage<80 → BadRequestException with `INCOMPLETE` payload including `missingFields`.
- T&C not accepted (enforcement on) → ForbiddenException with `TERMS_NOT_ACCEPTED` payload + `termsType` + `activeTermsId`.
- T&C not accepted but `TERMS_ENFORCEMENT_ENABLED=false` → success.

**Acceptance:**
- All 6 tests pass.
- 403 payload shape matches `{ errorCode: 'TERMS_NOT_ACCEPTED', termsType, activeTermsId }` exactly.
- `pnpm tsc --noEmit` clean.

## Verification

- `pnpm tsc --noEmit` clean across all changes
- All new unit tests pass
- Existing tests still pass (no regressions in lodgings or subscriptions modules)
- Manual smoke (optional, if DB up): `curl POST /lodgings` returns the new lodging + verify a row appeared in `subscriptions` table linked to `lodging-free`

## Out of Scope

- Admin approve/reject endpoints (Phase 3)
- Email notifications (Phase 4)
- The `welcome-business` notifications endpoint (Phase 4)
- Removing the `isPublic` column (deferred — too risky for this phase; keep for back-compat)
- Updating `findAllPaginated` (admin list) to surface `status` — Phase 3 will need this anyway
