# Requirements: Binntu Nest (Backend)

## Milestone: v1.1 Lodging Onboarding Backend

**Started:** 2026-05-13
**Source:** `binntu/.planning/BACKEND-SPEC.md` — Addendum: Lodging Onboarding Backend Gaps (Phase 4+)
**Driver:** Frontend Phase 4 wizard already shipped (binntu repo); requires backend endpoints + workflow before HUMAN-UAT can pass.

### Active

| ID | Title | Description | Status |
|----|-------|-------------|--------|
| ONB-BE-01 | Lodging status workflow | Add `status` enum column (`draft \| pending_review \| published \| rejected`) to `Lodging`, default `draft`, indexed. Migration backfills existing rows to `published`. | Done (Phase 1, 2026-05-13) |
| ONB-BE-02 | Public visibility filter switch | Switch `GET /lodgings/public` and sitemap fetches from `isPublic` to `status='published'`. Keep `isPublic` short-term for backwards compat. | Pending |
| ONB-BE-03 | Submit-for-review endpoint | `POST /lodgings/:id/submit-for-review` (auth + ownership). Validates `status in (draft,rejected)`, `completionPercentage>=80`, T&C `lodging` accepted. Transitions to `pending_review`, sets `submitted_at`, fires admin-pending email. | Pending |
| ONB-BE-04 | Admin approve/reject endpoints | `POST /admin/lodgings/:id/approve` and `POST /admin/lodgings/:id/reject` (admin role, body `{reason: string}` min 10). Validate `status='pending_review'`. Add `rejection_reason` column. Fire approval/rejection emails. | Pending |
| ONB-BE-05 | completionPercentage + missingFields | Owner-scoped `GET /lodgings/:id` returns computed `completionPercentage` (0-100) and `missingFields[]`. Weighted bucket compute per BACKEND-SPEC §5: Info 20%, Contact 15%, Price 10%, Rooms 20%, Photos 20%, Services 10%, Location 5%. Critical fields (★) required at 80%. | Pending |
| ONB-BE-06 | T&C guard on submit-for-review | Wire `TermsAcceptedGuard('lodging_creation')` (or equivalent) on submit-for-review endpoint only (NOT on draft create). 403 errorCode `TERMS_NOT_ACCEPTED` payload. | Pending |
| ONB-BE-07 | Plan Free auto-assignment | In same DB transaction as `POST /lodgings`, create a `Subscription` linked to the new lodging: planId=Plan Free, entityType='lodging', entityId=<new id>, status='active', currentPeriodEnd=null. | Pending |
| ONB-BE-08 | Plan Free seed | Migration seeds `lodging-free` Plan (priceInCents:0, billingInterval:'lifetime', isActive:true). Optional: add `is_default` boolean column on `Plan`. | Done (Phase 1, 2026-05-13) |
| ONB-BE-09 | Admin pending listing | `GET /admin/lodgings?status=pending_review` (admin role, paginated). Returns existing admin-list shape plus `submittedAt`. | Pending |
| ONB-BE-10 | Email notification hooks | Resend-based: (a) welcome on business onboarding signup, (b) submitted-for-review confirmation, (c) approved publication, (d) rejected with reason + wizard link, (e) admin internal notification on pending_review. Stub templates ok initially. | Pending |
| ONB-BE-11 | Documents → badge automation (optional) | DEFERRED to V2-12 per BACKEND-SPEC. Not in scope. | Deferred |

### Mapped to Frontend Requirements

| Frontend ONB | Backend dependency |
|--------------|--------------------|
| ONB-01 (signup intent → wizard redirect) | None (client-side state) |
| ONB-02 (wizard routes + 10 steps) | None |
| ONB-03 (incremental save on Next) | Existing `POST /lodgings` + `PATCH /lodgings/:id` |
| ONB-04 (completionPercentage in header) | **ONB-BE-05** |
| ONB-05 (T&C step inline) | Existing terms endpoints (Phase 1 backend) |
| ONB-06 (Plan Free auto-assigned) | **ONB-BE-07, ONB-BE-08** |
| ONB-07 (state machine: draft→pending_review→published/rejected) | **ONB-BE-01, ONB-BE-02, ONB-BE-03, ONB-BE-04** |
| ONB-08 (submit gate 80% + T&C) | **ONB-BE-03, ONB-BE-05, ONB-BE-06** |
| ONB-09 (admin pending list + approve/reject) | **ONB-BE-04, ONB-BE-09** |
| ONB-10 (email notifications a-e) | **ONB-BE-10** |
| ONB-11 (403 TERMS_NOT_ACCEPTED safety net) | **ONB-BE-06** (provides the 403 payload the safety net intercepts) |
| ONB-12 (documents step) | Existing documents module (Phase 2 backend) |
| ONB-13 (legacy banner) | **ONB-BE-01** (default `published` backfill keeps legacy lodgings visible) |

### Out of Scope

- ONB-BE-11 (documents → badge automation) — deferred to V2-12
- Phases 5-8 backend replication (restaurant/commerce/transport/guide onboarding) — separate future milestones
- `signupIntent` persistence — explicitly client-only (Zustand) per frontend assumption #1

### Validated

(none yet — milestone just started)

---
*Last updated: 2026-05-13*
