# Deferred Items — Phase 02 Owner Endpoints

## Pre-existing failures (out of scope)

### terms.service.spec.ts — DataSource not mocked

`src/modules/terms/services/terms.service.spec.ts` fails because Phase 1 added `DataSource`
to `TermsService` constructor but the spec file was not updated to provide a mock.

- **Status:** Pre-existing before Phase 2 (confirmed via git stash test)
- **Fix needed:** Add `{ provide: DataSource, useValue: { transaction: jest.fn() } }` to the spec's providers array
- **Owner:** Phase 3 or separate chore task
