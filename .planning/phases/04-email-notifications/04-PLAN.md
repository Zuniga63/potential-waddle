---
phase: 04-email-notifications
plan: 04
requirements: [ONB-BE-10]
status: planned
parallelization: false
autonomous: true
---

# Plan 04: Email Notifications for Lodging Onboarding

## Objective

Wire the 5 transactional emails for the lodging onboarding workflow, the welcome-business endpoint the frontend already calls, and the dispatcher hooks left as TODOs in Phase 2 (submit-for-review) and Phase 3 (approve/reject).

## Context

- `EmailModule` is `@Global()` with `ResendService` exported — every module can already inject it without explicit imports.
- Existing templates: `welcome.template.ts`, `reset-password.template.ts`. They export functions returning `{ html, subject }`. Match this pattern.
- The frontend `OnboardingRedirector` fires `POST ${API_URL}/notifications/welcome-business` with auth header. No backend endpoint exists yet — must be created.
- Frontend admin pages don't dispatch emails; backend approve/reject service methods must send them.
- Submit-for-review (Phase 2 `LodgingsService.submitForReview`) has `// TODO Phase 4` markers for owner-confirmation + admin-pending emails.
- Approve (`LodgingsService.approve`) has `// TODO Phase 4` for owner-approval email.
- Reject (`LodgingsService.reject`) has `// TODO Phase 4` for owner-rejection email.
- All email sends MUST be fire-and-forget at the call sites: dispatcher methods on `ResendService` already catch errors and log; the calling service must NOT `await` them blocking the response (or `await` but with `.catch(() => undefined)`). The HTTP response should not fail if Resend is down.

## Tasks

### Task 1: 5 email templates

**Files (all new):**
- `src/modules/email/templates/business-welcome.template.ts`
- `src/modules/email/templates/lodging-submitted.template.ts`
- `src/modules/email/templates/lodging-approved.template.ts`
- `src/modules/email/templates/lodging-rejected.template.ts`
- `src/modules/email/templates/admin-lodging-pending.template.ts`

**Pattern:** Each exports `get{Name}Template(args...): EmailTemplate` where `EmailTemplate = { subject, html }`. Follow the structure of `welcome.template.ts` — same table-based responsive HTML, same colors (#10b981 accent, #f4f4f4 bg), same header logo image, same Binntu footer.

**Specifics:**

1. **business-welcome.template.ts** — `getBusinessWelcomeTemplate(username: string, wizardUrl: string)`. Subject: "¡Bienvenido a Binntu Negocios! Comienza a publicar tu lodging". Copy emphasizes the business onboarding flow and includes a primary CTA button pointing to `wizardUrl` (e.g., `${FRONTEND_URL}/profile/negocios/lodgings/onboarding`).

2. **lodging-submitted.template.ts** — `getLodgingSubmittedTemplate(lodgingName: string)`. Subject: "Estamos validando tu negocio en Binntu". Copy: "Hemos recibido tu negocio '{lodgingName}' y nuestro equipo lo está revisando. Te notificaremos cuando esté publicado." No CTA button needed.

3. **lodging-approved.template.ts** — `getLodgingApprovedTemplate(lodgingName: string, publicUrl: string)`. Subject: "¡Tu negocio ya está publicado en Binntu!". Copy: celebratory; CTA button "Ver mi lodging" → `publicUrl` (e.g., `${FRONTEND_URL}/lodgings/{slug}`).

4. **lodging-rejected.template.ts** — `getLodgingRejectedTemplate(lodgingName: string, reason: string, wizardUrl: string)`. Subject: "Tu negocio necesita ajustes". Copy: explain the team reviewed and includes the reason in a highlighted block; CTA button "Editar mi lodging" → `wizardUrl`.

5. **admin-lodging-pending.template.ts** — `getAdminLodgingPendingTemplate(lodgingName: string, ownerEmail: string, adminPanelUrl: string)`. Subject: "Nuevo lodging pendiente de validación". Copy: short internal-style; CTA button "Revisar" → `adminPanelUrl` (e.g., `${FRONTEND_URL}/admin/lodgings/pending`).

**Acceptance:**
- Each template exports a function returning `{ subject, html }` typed as `EmailTemplate`.
- `pnpm tsc --noEmit` clean.
- Visually-defensible HTML (table layout, responsive, accent color, footer).

### Task 2: extend ResendService with 5 dispatcher methods

**Files:**
- `src/modules/email/services/resend.service.ts` (modify)

**Behavior:**

Add 5 public methods following the existing `sendWelcomeEmail` / `sendPasswordResetEmail` pattern:
- `sendBusinessWelcomeEmail(to: string, username: string): Promise<boolean>`
- `sendLodgingSubmittedEmail(to: string, lodgingName: string): Promise<boolean>`
- `sendLodgingApprovedEmail(to: string, lodgingName: string, slug: string): Promise<boolean>`
- `sendLodgingRejectedEmail(to: string, lodgingName: string, reason: string): Promise<boolean>`
- `sendAdminLodgingPendingNotification(lodgingName: string, ownerEmail: string): Promise<boolean>`

Each method:
1. Build URLs from `this.frontendUrl` (already in constructor):
   - `wizardUrl = ${this.frontendUrl}/profile/negocios/lodgings/onboarding`
   - `publicUrl = ${this.frontendUrl}/lodgings/${slug}`
   - `adminPanelUrl = ${this.frontendUrl}/admin/lodgings/pending`
2. Call the corresponding template function for `{ html, subject }`.
3. Call `this.resend.emails.send({ from: this.fromEmail, to, subject, html })`.
4. For admin notification: use the env var `ADMIN_NOTIFICATION_EMAIL` if set, fall back to `this.fromEmail`. Add this env var to `EnvironmentVariables` interface AND to the `appConfig()` factory (defaulting to empty string or `from` email).
5. Log success/failure like the existing methods. Catch all errors and return false (never throw — calling code is fire-and-forget).

**Acceptance:**
- All 5 methods exist with the documented signatures.
- `ADMIN_NOTIFICATION_EMAIL` added to env config typing + factory.
- `pnpm tsc --noEmit` clean.

### Task 3: Notifications module + controller + welcome-business endpoint

**Files (all new):**
- `src/modules/notifications/notifications.module.ts`
- `src/modules/notifications/notifications.controller.ts`
- `src/modules/notifications/notifications.controller.spec.ts`

**Register in `app.module.ts`:**
- Add `NotificationsModule` to imports.

**Controller:**
```typescript
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly resendService: ResendService) {}

  @Post('welcome-business')
  @UseGuards(JwtAuthGuard)
  @HttpCode(202)
  async welcomeBusiness(@GetUser() user: User) {
    // Fire-and-forget — don't block response on Resend
    void this.resendService.sendBusinessWelcomeEmail(user.email, user.firstName || user.email);
    return { ok: true };
  }
}
```

**Behavior:**
- `POST /notifications/welcome-business` — auth required, returns 202 immediately, dispatches business-welcome email in the background.
- Frontend already calls this (fire-and-forget) so a 5xx here must NOT block redirect — but since we return 202 even before Resend resolves, this is naturally safe.

**Tests:**
- Authenticated request → 202 returned, `resendService.sendBusinessWelcomeEmail` called with `user.email`.
- Unauthenticated request → 401 (JwtAuthGuard).

**Acceptance:**
- `POST /notifications/welcome-business` registered and authenticated.
- 2 tests pass.
- `pnpm tsc --noEmit` clean.

### Task 4: wire email hooks in submit-for-review / approve / reject

**Files:**
- `src/modules/lodgings/lodgings.service.ts` (modify — replace 3 TODO markers with real calls)

**Behavior:**

In `submitForReview({ identifier, user })`:
- After saving the status transition, fire-and-forget:
  ```typescript
  void this.resendService.sendLodgingSubmittedEmail(user.email, lodging.name);
  void this.resendService.sendAdminLodgingPendingNotification(lodging.name, user.email);
  ```
- Replace the existing `// TODO Phase 4: ...` comments.

In `approve({ identifier })`:
- After saving `status='published'`, fire-and-forget:
  ```typescript
  void this.resendService.sendLodgingApprovedEmail(lodging.user.email, lodging.name, lodging.slug);
  ```
- Replace the `// TODO Phase 4: notifyLodgingApproved` comment.

In `reject({ identifier, reason })`:
- After saving `status='rejected'` + `rejectionReason=reason`, fire-and-forget:
  ```typescript
  void this.resendService.sendLodgingRejectedEmail(lodging.user.email, lodging.name, reason);
  ```
- Replace the `// TODO Phase 4: notifyLodgingRejected` comment.

**Service constructor:** Inject `ResendService`. Update DI typing.

**Tests (update existing specs):**
- Submit-for-review happy path → verify `sendLodgingSubmittedEmail` AND `sendAdminLodgingPendingNotification` were called with correct args (mock ResendService in the test module).
- Approve happy path → verify `sendLodgingApprovedEmail` called.
- Reject happy path → verify `sendLodgingRejectedEmail` called with `reason`.
- Email send failures must NOT make the service method fail (mock ResendService method to reject; assert the lodging-side response is still successful).

**Acceptance:**
- All 3 TODO comments replaced.
- 4+ updated tests pass.
- `pnpm tsc --noEmit` clean.

## Verification

- `pnpm tsc --noEmit` clean across all changes
- All new tests pass + no regressions in existing tests
- Smoke if local backend runs: call `POST /notifications/welcome-business` with a valid JWT → 202 + log line showing email send attempted
- `git grep "TODO Phase 4"` in `src/modules/lodgings/lodgings.service.ts` returns empty

## Out of Scope

- Localized templates beyond Spanish (current `welcome.template.ts` is Spanish-only — match)
- HTML email preview tooling
- Bounce/spam handling
- Re-trying failed email sends (delegated to Resend's own retry; just log)
- The "ONB-10 part a is welcome before signup" alternative path — we land on the `/notifications/welcome-business` endpoint approach
