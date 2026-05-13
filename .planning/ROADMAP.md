# Roadmap: Binntu Nest Backend — v1.1 Lodging Onboarding Backend

## Overview

Implementar el backend de Phase 4 del frontend (Lodging Onboarding Wizard). El frontend (repo `binntu`) ya tiene el wizard completo de 10 pasos, el flujo de signup-intent, el 403 safety net, y la UI admin de pending lodgings. Falta el backend que provea: workflow de estado (draft→pending_review→published/rejected), endpoint `submit-for-review` con guards, completion percentage server-side, endpoints admin approve/reject, auto-asignación de Plan Free, y emails transaccionales.

## Phases

**Phase Numbering:** Integer phases (1, 2, 3, 4) — sequential.

- [x] **Milestone v1.0: Terms & Conditions** — terms documents, acceptances, signup gating, business creation guard (completed 2026-04-30, commits up to `d083c63`)
- [x] **Phase 1: Lodging status workflow + Plan Free seed** — Migrations: `status`, `submitted_at`, `rejection_reason` columns on Lodging (backfill legacy → published); seed `lodging-free` Plan; optional `is_default` column on Plan (completed 2026-05-13, commits 3f8bef8, 580fb8a)
- [x] **Phase 2: Owner-facing endpoints** — Submit-for-review endpoint with T&C guard + 80% gate; computed completionPercentage + missingFields on owner GET /lodgings/:id; public list filter switch; Plan Free auto-subscription on POST /lodgings (completed 2026-05-13, commits 2cc2139, a0dab08, dfbf887, 972fde5, 239299f)
- [ ] **Phase 3: Admin validation endpoints** — Approve/reject admin endpoints; pending listing with submittedAt
- [ ] **Phase 4: Email notifications** — Resend templates + dispatch hooks for welcome, submitted, approved, rejected, admin-pending

## Phase Details

### Phase 1: Lodging status workflow + Plan Free seed
**Goal**: La entidad Lodging soporta el state machine (draft/pending_review/published/rejected) con timestamps de transición, las filas legacy quedan en `published`, y existe el Plan `lodging-free` listo para auto-asignación.
**Depends on**: Nothing (foundation for downstream phases)
**Requirements**: ONB-BE-01, ONB-BE-08

**Success Criteria** (what must be TRUE):
  1. Migration ejecuta limpio en DB con datos legacy; `Lodging.status` existe como enum column con default `draft`; índice spatial intacto
  2. Migration backfill setea `status='published'` para todas las filas pre-existentes (no rompe los lodgings ya publicados)
  3. Migration añade columnas `submitted_at: timestamp nullable` y `rejection_reason: text nullable`
  4. Migration seed inserta Plan con slug `lodging-free`, priceInCents=0, billingInterval='lifetime', isActive=true
  5. `pnpm tsc --noEmit` clean; `pnpm test` para módulos lodgings + subscriptions pasa

### Phase 2: Owner-facing endpoints
**Goal**: El owner de un lodging puede submit-for-review con guards de T&C y completitud, recibe `completionPercentage` y `missingFields` en cada GET, las listas públicas filtran por `status='published'`, y al crear un lodging se le auto-asigna una subscription al Plan Free.
**Depends on**: Phase 1
**Requirements**: ONB-BE-02, ONB-BE-03, ONB-BE-05, ONB-BE-06, ONB-BE-07

**Success Criteria** (what must be TRUE):
  1. `POST /lodgings/:id/submit-for-review` existe, requiere auth + ownership, valida status in (draft, rejected), valida completionPercentage ≥ 80, valida T&C `lodging` aceptado (403 `TERMS_NOT_ACCEPTED` payload), transiciona a `pending_review`, setea `submitted_at`, retorna lodging actualizado
  2. `GET /lodgings/:id` (owner-scoped) retorna `completionPercentage` (0-100) y `missingFields[]` calculados con los pesos del BACKEND-SPEC §5; campos críticos enforced para el 80% gate
  3. `GET /lodgings/public` filtra por `status='published'` (no por `isPublic` solamente); sitemap fetches actualizadas
  4. `POST /lodgings` crea Lodging + Subscription al `lodging-free` Plan en la misma transacción (rollback si falla cualquiera de las dos)
  5. Tests unitarios para: completionPercentage cómputo (varios casos), submit-for-review validations (400 si <80%, 400 si status incorrecto, 403 si T&C no aceptado), auto-subscription en POST /lodgings
  6. `pnpm tsc --noEmit` clean

### Phase 3: Admin validation endpoints
**Goal**: El admin puede ver la queue de lodgings pendientes y aprobarlos o rechazarlos con motivo; las transiciones de estado disparan los emails correspondientes (los emails se wirean en Phase 4, pero los hooks/dispatchers existen).
**Depends on**: Phase 1, Phase 2 (state machine + submit-for-review must work first)
**Requirements**: ONB-BE-04, ONB-BE-09

**Success Criteria** (what must be TRUE):
  1. `POST /admin/lodgings/:id/approve` existe, requiere admin role, valida `status='pending_review'`, transiciona a `published`, fire hook de email approval
  2. `POST /admin/lodgings/:id/reject` existe, requiere admin role, body `{reason: string min 10}`, valida `status='pending_review'`, transiciona a `rejected`, persiste `rejection_reason`, fire hook de email rejection
  3. `GET /admin/lodgings?status=pending_review` paginado, returns shape compatible con admin list existente + campo `submittedAt`
  4. Tests unitarios para: approve happy path + invalid status, reject happy path + invalid status + reason validation, pending listing pagination
  5. `pnpm tsc --noEmit` clean

### Phase 4: Email notifications
**Goal**: Los emails transaccionales del flow de onboarding se envían via Resend, los hooks expuestos en Phase 2 y 3 reciben implementaciones reales (no stubs), y existen templates básicos para los 5 casos.
**Depends on**: Phase 2, Phase 3 (hooks must exist first)
**Requirements**: ONB-BE-10

**Success Criteria** (what must be TRUE):
  1. Template + service method para welcome email (business onboarding)
  2. Template + service method para submitted-for-review confirmation (al owner)
  3. Template + service method para approval (al owner, con link al public page)
  4. Template + service method para rejection (al owner, con `rejectionReason` + CTA al wizard)
  5. Template + service method para admin-pending internal notification (al admin email configurado)
  6. Submit-for-review dispatcher (Phase 2) invoca el email de submitted-for-review + admin-pending
  7. Approve/reject dispatchers (Phase 3) invocan email de approval/rejection
  8. Welcome endpoint `POST /notifications/welcome-business` (lo que el frontend OnboardingRedirector llama) existe (auth required) y dispatchea el welcome email
  9. Tests verifican que los hooks son llamados con los args correctos (mock Resend client)

---
*Last updated: 2026-05-13 — Phase 2 complete*
