# Code Conventions

## Formatting (Prettier)

From `.prettierrc`:

| Setting | Value |
|---------|-------|
| `singleQuote` | `true` — single quotes for strings |
| `trailingComma` | `"all"` — trailing commas everywhere |
| `arrowParens` | `"avoid"` — `x => x` not `(x) => x` |
| `tabWidth` | `2` — 2-space indentation |
| `printWidth` | `120` — 120 char line width |
| `semi` | `true` — semicolons required |
| `bracketSpacing` | `true` — `{ foo }` not `{foo}` |
| `bracketSameLine` | `false` — JSX-style closing on new line |
| `endOfLine` | `"lf"` — Unix line endings |

## Linting (ESLint)

From `.eslintrc.js`:

- Parser: `@typescript-eslint/parser`
- Extends: `plugin:@typescript-eslint/recommended`, `plugin:prettier/recommended`
- Env: `node`, `jest`

**Relaxed rules** (intentionally off):
- `@typescript-eslint/interface-name-prefix` — no `I` prefix enforcement
- `@typescript-eslint/explicit-function-return-type` — return types optional
- `@typescript-eslint/explicit-module-boundary-types` — boundary types optional
- `@typescript-eslint/no-explicit-any` — `any` allowed

## Naming

| Artifact | Convention | Example |
|----------|-----------|---------|
| Classes, types, interfaces, enums | PascalCase | `UsersService`, `CreateUserDto`, `AppPermissionsEnum` |
| Functions, variables | camelCase | `createSlug`, `calculateAge`, `userId` |
| Constants (exported) | UPPER_SNAKE or camelCase | varies by module |
| Directories | kebab-case | `google-places/`, `public-events/` |
| Files | kebab-case with suffix | `users.service.ts`, `create-user.dto.ts` |
| DTOs | `Dto` suffix always | `CreateUserDto`, `UpdateReviewDto` |
| Entities | `{Name}` + file `.entity.ts` | `User` in `user.entity.ts` |

## File Suffixes

- `.service.ts` — business logic class injected into controllers
- `.controller.ts` — HTTP route handler
- `.module.ts` — NestJS module declaration
- `.dto.ts` — request/response data shape (class-validator decorated)
- `.entity.ts` — TypeORM entity (DB table)
- `.interface.ts` — TS interface/type
- `.enum.ts` — TS enum
- `.spec.ts` — unit test (Jest)
- `.e2e-spec.ts` — E2E test
- `.decorator.ts` — custom NestJS decorator
- `.guard.ts` — NestJS guard (auth, roles)
- `.interceptor.ts` — NestJS interceptor
- `.pipe.ts` — NestJS pipe

## Import Ordering

Observed 5-layer convention in service files:

```ts
// 1. NestJS core imports
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// 2. Third-party libs
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

// 3. Same-module imports (relative)
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

// 4. Parent/sibling modules (relative)
import { TenantService } from '../../tenant/services/tenant.service';

// 5. Absolute `src/` imports
import { AppPermissionsEnum } from 'src/config/app-permissions.enum';
```

## Path Aliases

- `tsconfig.json` defines `baseUrl: "./"` only
- **No aliases** (`@/`, `~/`) configured
- Imports are either relative or absolute from project root (`src/...`)

## Barrel Files

`index.ts` is used to re-export from directories:

- `src/modules/{feature}/entities/index.ts` — re-exports all entities
- `src/utils/index.ts` — re-exports all utilities
- `src/config/index.ts` — re-exports configs

Not all directories have barrels — convention is applied where it simplifies imports.

## Error Handling

**Standard pattern — NestJS HTTP exceptions:**

```ts
if (!user) {
  throw new NotFoundException('User not found');
}

if (invalidInput) {
  throw new BadRequestException('Invalid email format');
}
```

**Common exceptions in use:**
- `NotFoundException` — resource doesn't exist
- `BadRequestException` — invalid input
- `UnauthorizedException` — missing/invalid auth
- `ForbiddenException` — authenticated but not permitted
- `ConflictException` — state conflict (e.g., duplicate)
- `InternalServerErrorException` — unexpected failures

**Try/catch pattern** — for external calls where fallback is desired:

```ts
try {
  return await this.externalApi.fetch(id);
} catch (error) {
  this.logger.error(`Failed to fetch ${id}`, error);
  return null; // graceful fallback
}
```

**Inconsistency noted:** some services silently swallow errors or return null without logging. See `CONCERNS.md`.

## Logging

Standard NestJS `Logger` instance per service:

```ts
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async create(dto: CreateUserDto) {
    this.logger.log(`Creating user: ${JSON.stringify(dto)}`);
    // ...
    this.logger.log(`User created with id ${user.id}`);
  }
}
```

**Levels used:**
- `logger.log()` — informational (default)
- `logger.error()` — errors with optional stack
- `logger.warn()` — non-critical issues
- `logger.debug()` — rarely used

## Comments & Documentation

**ASCII dividers** separate sections inside large service files:

```ts
// ------------------------------------------------------------------------------------------------
// CREATE OPERATIONS
// ------------------------------------------------------------------------------------------------

async create(...) { }

// ------------------------------------------------------------------------------------------------
// QUERY OPERATIONS
// ------------------------------------------------------------------------------------------------

async findAll(...) { }
```

**JSDoc** used selectively on utility functions:

```ts
/**
 * Generates a URL-safe slug from a string.
 * @param input - The raw string
 * @returns Lowercase hyphenated slug
 */
export function createSlug(input: string): string { }
```

**Inline comments** — used sparingly; mostly for:
- Security rationale (why a check exists)
- Non-obvious algorithm notes
- TODO markers

## Validation

**DTOs use class-validator decorators:**

```ts
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(2, 60)
  name: string;

  @IsOptional()
  @Length(6, 100)
  password?: string;
}
```

**Global validation pipe** configured in `src/config/validation-pipe.config.ts` — applied in `main.ts`.

**Env vars validated** via Joi schema (`src/config/joi-validation.schema.ts`) at bootstrap.

## Async Patterns

- `async/await` universally (no raw Promise chains)
- TypeORM returns Promises — always awaited
- Top-level parallelism via `Promise.all([...])` when calls are independent

## Module Patterns

Every `@Module` typically:

1. `imports: [TypeOrmModule.forFeature([...])]` — registers entities
2. `controllers: [...]`
3. `providers: [...]` — services, guards, strategies
4. `exports: [...]` — services needed by other modules

```ts
@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## Dependency Injection

Constructor injection is standard:

```ts
constructor(
  @InjectRepository(User) private readonly userRepo: Repository<User>,
  private readonly tenantService: TenantService,
  private readonly logger: Logger,
) {}
```

- `private readonly` for injected deps
- `@InjectRepository(Entity)` for TypeORM repos
- No field injection or setter injection

## Common Anti-Patterns Found

See `CONCERNS.md` for details:
- Oversized services (900+ lines) mixing concerns
- Missing transactional boundaries on multi-entity writes
- Inconsistent error handling (some silent, some throw)
- N+1 queries in review-heavy services
