---
phase: 04-email-notifications
plan: 04
subsystem: email-notifications
status: complete
tags: [email, resend, transactional, lodging-onboarding, notifications]
dependency_graph:
  requires: [03-admin-endpoints]
  provides: [ONB-BE-10]
  affects: [lodgings-service, email-module, notifications-module]
tech_stack:
  added: []
  patterns:
    - fire-and-forget void dispatcher pattern for transactional email
    - table-based responsive HTML email templates matching existing Binntu style
    - @Global() EmailModule makes ResendService injectable without explicit imports
key_files:
  created:
    - src/modules/email/templates/business-welcome.template.ts
    - src/modules/email/templates/lodging-submitted.template.ts
    - src/modules/email/templates/lodging-approved.template.ts
    - src/modules/email/templates/lodging-rejected.template.ts
    - src/modules/email/templates/admin-lodging-pending.template.ts
    - src/modules/notifications/notifications.controller.ts
    - src/modules/notifications/notifications.module.ts
    - src/modules/notifications/notifications.controller.spec.ts
  modified:
    - src/modules/email/services/resend.service.ts
    - src/config/app-config.ts
    - src/app.module.ts
    - src/modules/lodgings/lodgings.service.ts
    - src/modules/lodgings/lodgings.service.spec.ts
    - src/modules/lodgings/admin-lodgings.controller.spec.ts
decisions:
  - Use Auth() composite decorator (JwtAuthGuard + PermissionsGuard) for welcome-business endpoint — consistent with existing pattern
  - sendAdminLodgingPendingNotification warns and returns false when ADMIN_NOTIFICATION_EMAIL is unset — no crash, graceful degradation
  - ResendService injected directly into LodgingsService constructor — EmailModule is @Global() so no explicit import needed
  - Fire-and-forget via void keyword — HTTP response never blocked by Resend latency or failures
  - Template resilience test uses mockResolvedValue(false) not mockRejectedValueOnce — avoids unhandled rejection bleeding between tests
metrics:
  duration_minutes: 35
  completed_date: 2026-05-13
  tasks_completed: 4
  tasks_total: 4
  files_created: 8
  files_modified: 6
---

# Phase 4 Plan 04: Email Notifications for Lodging Onboarding — Summary

## One-liner

5 transactional email templates + 5 ResendService dispatchers + `POST /notifications/welcome-business` endpoint + fire-and-forget hooks wired into `submitForReview` / `approve` / `reject`, with `ADMIN_NOTIFICATION_EMAIL` env var for admin routing.

## Tasks Completed

| # | Task | Commit | Key deliverables |
|---|------|--------|-----------------|
| 1 | 5 email templates | 12654e1 | business-welcome, lodging-submitted, lodging-approved, lodging-rejected, admin-lodging-pending |
| 2 | ResendService dispatcher methods | 06d6953 | 5 new methods, ADMIN_NOTIFICATION_EMAIL in EnvironmentVariables + appConfig |
| 3 | NotificationsModule + controller | 5461177 | POST /notifications/welcome-business, 202, auth guard, 3 tests |
| 4 | Wire TODO hooks | 606900a | 3 TODO markers replaced, ResendService injected into LodgingsService, 4+ new tests |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test isolation: mockRejectedValueOnce leaks with void**
- **Found during:** Task 3 notifications.controller.spec.ts
- **Issue:** Using `mockRejectedValueOnce` on a `void`-ed promise caused an unhandled rejection that surfaced in the subsequent test, breaking test 3.
- **Fix:** Changed test 2 to use `mockResolvedValue(false)` — matches the real `ResendService` contract (it catches errors internally and returns false, never rejects).
- **Files modified:** `src/modules/notifications/notifications.controller.spec.ts`
- **Commit:** 5461177

**2. [Rule 2 - Missing critical functionality] Admin email graceful degradation**
- **Found during:** Task 2 implementation
- **Issue:** Plan said "use ADMIN_NOTIFICATION_EMAIL if set, fall back to fromEmail" but falling back silently to `fromEmail` for admin notifications would send admin emails to the noreply sender — confusing and wrong.
- **Fix:** When `ADMIN_NOTIFICATION_EMAIL` is empty, log a warning and return false (skip send) rather than fallback to fromEmail. Admin notifications are only meaningful if an admin email is configured.
- **Files modified:** `src/modules/email/services/resend.service.ts`
- **Commit:** 06d6953

## Verification

- `pnpm tsc --noEmit` — clean (only engine version warning from pnpm, not TypeScript errors)
- `git grep "TODO Phase 4" src/modules/lodgings/lodgings.service.ts` — returns empty
- All Phase 4 test suites pass: notifications.controller.spec (3), lodgings.service.spec (9), admin-lodgings.controller.spec (11)
- Pre-existing failures in guides, commerce, terms.service.spec are unrelated to Phase 4 (tracked in deferred-items.md from Phase 2)

## Known Stubs

None. All 5 dispatcher methods build URLs from `this.frontendUrl` (configured via `FRONTEND_URL` env var). No hardcoded placeholders.

## Threat Flags

None. The new `POST /notifications/welcome-business` endpoint is behind `@Auth()` (JwtAuthGuard). No unauthenticated surface added. Email dispatchers are internal server-to-Resend calls — no user-controlled data flows into email recipients (recipient is always the authenticated user's own email or the configured admin email).

## Self-Check

All 4 task commits verified in git log:
- 12654e1 — templates created
- 06d6953 — ResendService extended
- 5461177 — NotificationsModule registered in AppModule
- 606900a — LodgingsService TODO hooks replaced
