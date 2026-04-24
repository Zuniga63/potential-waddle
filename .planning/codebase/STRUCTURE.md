# Directory Structure

## Root Layout

```
binntu-nest/
├── .claude/              # Claude Code config (agents, commands)
├── .planning/            # GSD planning artifacts
├── dist/                 # Compiled TypeScript output (gitignored build artifacts)
├── docs/                 # Project documentation (README, design notes)
├── node_modules/         # Dependencies (pnpm managed)
├── postgres/             # Local PostgreSQL data (gitignored)
├── src/                  # Application source (main entry point)
├── test/                 # E2E tests
├── .env                  # Environment variables (gitignored)
├── .env.example          # Sample env vars for new contributors
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── docker-compose.yaml   # Local PostgreSQL container setup
├── nest-cli.json         # NestJS CLI config
├── package.json          # Dependencies and scripts
├── pnpm-lock.yaml        # Lockfile
├── tsconfig.json         # TypeScript config (dev)
├── tsconfig.build.json   # TypeScript config (build)
└── wf.json               # Workflow config
```

## `src/` Structure

```
src/
├── app.module.ts         # Root module composing all feature modules
├── main.ts               # Bootstrap (server startup, global pipes/filters)
├── config/               # App-wide configuration
├── migrations/           # TypeORM migrations (SQL schema evolution)
├── modules/              # Feature modules (business domains)
├── scripts/              # One-off scripts (seeds, data ops)
├── types/                # Shared TypeScript type definitions
└── utils/                # Generic helper functions
```

## `src/config/` — Configuration Files

| File | Purpose |
|------|---------|
| `app-config.ts` | Central app configuration loader |
| `app-permissions.enum.ts` | Role-based permission enum |
| `cloudinary-folders.ts` | Upload folder mappings |
| `cloudinary-presets.enum.ts` | Image transformation presets |
| `connection-source.ts` | TypeORM DataSource for migrations CLI |
| `joi-validation.schema.ts` | ENV var validation schema |
| `point-bonus.ts` | Gamification scoring config |
| `resource-provider.enum.ts` | Enum of cloud storage providers |
| `swagger-tags.enum.ts` | OpenAPI tag groupings |
| `swagger.config.ts` | Swagger/OpenAPI setup |
| `type-orm.config.ts` | TypeORM DB connection config |
| `validation-pipe.config.ts` | Global ValidationPipe config |

## `src/modules/` — Feature Modules (35+ domains)

**Core infrastructure:**
- `core/` — Shared infrastructure primitives
- `common/` — Cross-cutting utilities
- `auth/` — Authentication (JWT, Google OAuth, Passport)
- `users/` — User accounts, profiles, roles
- `roles/` — Permission/role management
- `tenant/` — Multi-tenant request handling

**Content domains (destination platform):**
- `places/` — Points of interest (sites, landmarks)
- `restaurants/` — Restaurant listings
- `lodgings/` — Hotels, stays, accommodations
- `experiences/` — Tours, activities, tickets
- `guides/` — Guide content (articles, editorial)
- `towns/` — Town/location master data
- `transport/` — Transportation providers
- `home/` — Homepage content composition

**User-generated:**
- `reviews/` — User reviews with moderation
- `public-events/` — Community event listings
- `whatsapp-clicks/` — Click-through tracking

**Commerce & ops:**
- `commerce/` — Orders, checkout, booking
- `subscriptions/` — Recurring membership plans
- `promotions/` — Discounts, promo codes
- `dashboard/` — Admin analytics dashboards

**Integrations & services:**
- `ai/` — Claude/Gemini/OpenAI providers
- `pinecone/` — Vector DB embeddings
- `google-places/` — Google Places API integration
- `cloudinary/` — Image upload/transform
- `email/` — Transactional email (Resend)
- `tinify/` — Image compression
- `turnstile/` — Cloudflare CAPTCHA
- `map/` — Map tile/geocoding helpers
- `analytics/` — BigQuery analytics bridge
- `documents/` — File/document handling

**Internal:**
- `rafa/` — Internal/admin tooling (named convention)
- `seeds/` — Database seed data

## Typical Module Layout

Every feature module follows this pattern:

```
src/modules/{feature}/
├── {feature}.module.ts      # NestJS module declaration
├── constants/               # Module-local constants
├── controllers/             # HTTP route handlers
│   └── {feature}.controller.ts
├── decorators/              # Custom param/method decorators
├── dto/                     # Request/response shapes
│   ├── create-{feature}.dto.ts
│   └── update-{feature}.dto.ts
├── entities/                # TypeORM entities
│   ├── {feature}.entity.ts
│   └── index.ts             # Barrel export
├── interfaces/              # TS interfaces/types
├── services/                # Business logic
│   └── {feature}.service.ts
└── utils/                   # Module-local helpers
```

Example: `src/modules/users/` contains exactly this structure.

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Directories | kebab-case | `google-places/`, `public-events/` |
| Classes/Types | PascalCase | `UsersService`, `CreateUserDto` |
| Functions/variables | camelCase | `createSlug`, `calculateAge` |
| Files | kebab-case with suffix | `users.service.ts`, `create-user.dto.ts` |
| Test files | `.spec.ts` (unit) / `.e2e-spec.ts` (e2e) | `guides.service.spec.ts` |
| Entities | `{name}.entity.ts` | `user.entity.ts` |
| DTOs | `{action}-{resource}.dto.ts` | `create-review.dto.ts` |
| Enums | `{name}.enum.ts` | `app-permissions.enum.ts` |
| Interfaces | `{name}.interface.ts` | |
| Barrel files | `index.ts` | `entities/index.ts` |

## Migrations

Located in `src/migrations/`. TypeORM generates timestamp-prefixed files:
- `{timestamp}-{description}.ts`

Run via scripts defined in `package.json` (`typeorm:migration:run`, etc).

## `test/` Directory

```
test/
├── app.e2e-spec.ts       # E2E smoke test (app bootstrap, health check)
└── jest-e2e.json         # Jest config for E2E pattern
```

## `src/utils/` — Generic Helpers

| File | Purpose |
|------|---------|
| `calculate-age.ts` | Date → years utility |
| `circular-area.ts` | Geospatial area math |
| `conversions.ts` | Unit conversions |
| `create-slug.ts` | URL slug from string |
| `generate-sort-by-options.ts` | Query sort option builder |
| `map-validation-errors.ts` | Flatten class-validator errors |
| `parse-array-value.ts` | Query param array parsing |
| `parse-number-range-filter-to-array.ts` | Range filter parser |
| `parse-numeric-filter-to-array.ts` | Numeric filter parser |
| `index.ts` | Barrel export |

## Where to Add New Features

**New business domain (e.g., "tours"):**
1. Create `src/modules/tours/` with standard subdirectories
2. Add `ToursModule` to `app.module.ts` imports
3. Register entities in module's `TypeOrmModule.forFeature([...])`
4. Add migrations in `src/migrations/`
5. Tag controller in Swagger via `SwaggerTagsEnum`

**New shared utility:**
- Pure function → `src/utils/`
- Has NestJS dependencies → `src/modules/common/` or relevant module

**New configuration:**
- Env-driven → `.env.example` + `joi-validation.schema.ts` + `app-config.ts`
- Static → `src/config/` as new file + export from `src/config/index.ts`

**New integration (external API):**
- Own module under `src/modules/{provider}/`
- Follow pattern of `cloudinary/`, `pinecone/`, `ai/`

## Path Resolution

- `tsconfig.json` has `baseUrl: "./"` but **no path aliases**
- Imports use relative paths (`../entities/user.entity`) or module-root (`src/modules/...`)
- No `@/` or `~/` aliases in use

## Special / Ignored Paths

- `node_modules/` — pnpm-managed; never edit
- `dist/` — build output; gitignored
- `postgres/` — local Postgres data volume; gitignored
- `.env` — gitignored; use `.env.example` as template
