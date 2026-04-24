# Testing

## Framework

- **Jest** 29.7.0 — test runner and assertion library
- **ts-jest** — TypeScript transformer for Jest
- **supertest** — HTTP assertion library for E2E tests
- **@nestjs/testing** — NestJS `Test.createTestingModule` utility

## Configuration

### Unit Tests

Config embedded in `package.json`:

```json
{
  "jest": {
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "moduleFileExtensions": ["js", "json", "ts"],
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### E2E Tests

Separate config in `test/jest-e2e.json`:

- Test files match `.e2e-spec.ts$`
- Located in `test/` directory
- Run against bootstrapped `AppModule`

## NPM Scripts

From `package.json`:

```bash
pnpm test              # Run unit tests
pnpm test:watch        # Watch mode
pnpm test:cov          # Coverage report
pnpm test:debug        # Debug with --inspect-brk
pnpm test:e2e          # Run E2E tests
```

## Current Test Coverage

**State: minimal.** Only 4 unit spec files exist:

| File | Purpose |
|------|---------|
| `src/modules/commerce/commerce.service.spec.ts` | Commerce service placeholder |
| `src/modules/commerce/commerce.controller.spec.ts` | Commerce controller placeholder |
| `src/modules/guides/guides.service.spec.ts` | Guides service placeholder |
| `src/modules/guides/guides.controller.spec.ts` | Guides controller placeholder |

**Observation:** These are NestJS-generated scaffolding — they only verify the class is defined:

```ts
describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

No behavioral assertions, no mocks, no fixtures.

**E2E:** `test/app.e2e-spec.ts` — single bootstrap health-check test.

## Test Structure Pattern

When tests are written, they follow NestJS conventions:

**Unit test:**
1. `Test.createTestingModule({ ... })` assembles the target class + deps
2. `.compile()` returns a `TestingModule`
3. Retrieve instance via `module.get(Class)`
4. Use `describe`/`it` blocks with Jest assertions

**E2E test:**
1. Bootstrap full `AppModule` via `Test.createTestingModule`
2. `app.init()` to start the app
3. Use `supertest(app.getHttpServer())` for HTTP assertions

## Mocking Patterns

**Currently not used in the codebase.** When added, the NestJS convention is:

```ts
{
  provide: Repository<User>,
  useValue: {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  },
}
```

Or use `@golevelup/ts-jest` `createMock()` for deep mocks.

## Coverage

Configuration captures coverage from all `.ts`/`.js` files under `src/`, output to `coverage/` at repo root.

**Current coverage is effectively 0%** — only scaffold tests run.

## Test Database

**No test DB setup exists.** Real tests would need:
- A test PostgreSQL instance (docker-compose variant, or in-memory equivalent)
- Migration/seed runner for test setup
- Teardown between tests

E2E tests currently hit only app bootstrap, not DB-backed endpoints.

## What's Missing (Gaps)

See `CONCERNS.md` for full list. Highlights:

- **Business-critical services untested:**
  - `seeds.service` (1492 lines, no tests)
  - `reviews` services (rating math, moderation — no tests)
  - `commerce` (checkout flow — scaffold only)
  - Payment/subscription endpoints (no tests)
  - `auth` module (JWT/Google OAuth flows — no tests)

- **Transaction rollback scenarios not covered**
- **External API error paths untested** (Google Places, AI providers, Pinecone)
- **Cloudinary/file upload flows lack integration tests**
- **Tenant isolation not verified via tests**

## Recommendations for Future Tests

1. **Prioritize services with complex business logic:**
   - `reviews` rating aggregation
   - `commerce` checkout + promo codes
   - `auth` guards and role checks

2. **Integration over unit** where services compose many deps — test the module boundary (controller → service → mocked repo).

3. **E2E for critical user flows:**
   - Signup / login
   - Create review on place
   - Complete purchase

4. **Contract tests for integrations:**
   - Google Places response shape
   - AI provider fallback order
   - Cloudinary upload/delete lifecycle
