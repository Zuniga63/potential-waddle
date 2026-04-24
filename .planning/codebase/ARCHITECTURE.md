# Architecture

**Analysis Date:** 2026-04-24

## Pattern Overview

**Overall:** Modular Monolith with Feature-Based Module Architecture

This is a NestJS-based backend following a feature-module pattern where business domains are organized as independent modules with clear boundaries. The architecture emphasizes separation of concerns through layered patterns within each module (controller → service → repository).

**Key Characteristics:**
- Feature modules encapsulate related functionality (users, places, reviews, restaurants, etc.)
- Tenant-aware request handling via header/origin extraction
- Multi-external integration support (AI, cloud storage, analytics)
- TypeORM for database abstraction with PostgreSQL
- Global exception handling and request/response interceptors
- Swagger API documentation built-in

## Layers

**Presentation/Controller Layer:**
- Purpose: Handle HTTP requests, validate input, route to services
- Location: `src/modules/[module-name]/controllers/`, `src/modules/[module-name]/[entity].controller.ts`
- Contains: `@Controller()` classes with route decorators, dependency injection
- Depends on: Services from the same module
- Used by: HTTP clients, API consumers
- Example: `src/modules/users/controllers/users.controller.ts` handles GET/POST for user endpoints

**Service Layer:**
- Purpose: Business logic, orchestration, data transformation
- Location: `src/modules/[module-name]/services/[service-name].service.ts`
- Contains: `@Injectable()` services with core business logic, async operations, validation
- Depends on: Repository layer (TypeOrmModule), other services (via imports), external services
- Used by: Controllers, other services
- Example: `src/modules/places/places.service.ts` handles place creation, filtering, image management

**Repository Layer:**
- Purpose: Data access abstraction via TypeORM
- Location: Not explicit - uses TypeORM's `Repository` injected via `@InjectRepository()`
- Contains: Database queries via TypeORM QueryBuilder and find methods
- Depends on: Database entities
- Used by: Service layer
- Example: In `src/modules/users/services/users.service.ts`, repositories are injected for User, UserPoint entities

**Data Layer:**
- Purpose: Entity definitions, database schema representation
- Location: `src/modules/[module-name]/entities/[entity].entity.ts`
- Contains: TypeORM entities with decorators (@Entity, @Column, @ManyToOne, etc.)
- Depends on: None (TypeORM)
- Used by: Repository, Services
- Example: `src/modules/places/entities/place.entity.ts` defines the Place database schema

**DTO Layer:**
- Purpose: Request/response data transformation, validation
- Location: `src/modules/[module-name]/dto/[operation].dto.ts`
- Contains: `class-validator` decorated classes for validation rules
- Depends on: None
- Used by: Controllers (via `@Body()` decorator), Services (return types)
- Example: `src/modules/users/dto/user.dto.ts` defines the user response structure

**Common/Shared Layer:**
- Purpose: Cross-cutting concerns, utilities, shared infrastructure
- Location: `src/modules/common/`, `src/utils/`, `src/config/`
- Contains: Filters, interceptors, decorators, pipes, middleware, validation
- Depends on: NestJS core
- Used by: All modules
- Example: `src/modules/common/filters/all-exceptions.filter.ts` handles all application exceptions

## Data Flow

**Request Handling Flow:**

1. HTTP request arrives at global middleware/interceptors
2. `TenantInterceptor` (`src/modules/tenant/tenant.interceptor.ts`) extracts tenant info from header or origin
3. Request reaches appropriate controller based on route
4. Controller validates input via DTOs and `ValidationPipe`
5. Controller calls service method
6. Service executes business logic, may call other services or repositories
7. Service returns data
8. Controller formats response (optional transformation via DTOs)
9. Response passes through interceptors for logging
10. `AllExceptionsFilter` catches any errors at any layer
11. Response sent to client

**Example: Creating a Place Review:**

1. POST `/api/reviews/places/:placeId` with review data
2. `PlacesController` or `EntityReviewsController` receives request
3. DTO validation ensures review data is correct
4. `EntityReviewsService.createReview()` is called
5. Service validates place exists, user exists, no duplicate reviews
6. Service creates Review entity, optionally creates ReviewImage entities
7. Service saves to database via TypeOrmModule repositories
8. Service returns populated ReviewDto
9. Controller returns 201 with review data

**State Management:**
- Request-scoped: Tenant context (stored in request object via interceptor)
- Session-scoped: JWT authentication via `AuthService` and strategies
- Application-scoped: Configuration via ConfigModule
- Database-scoped: All persistent state in PostgreSQL

## Key Abstractions

**Module Pattern:**
- Purpose: Encapsulate feature domains with their own controllers, services, entities
- Examples: `src/modules/users/`, `src/modules/places/`, `src/modules/reviews/`
- Pattern: Each module uses `@Module()` decorator to declare imports, controllers, providers, exports

**Service Injection:**
- Purpose: Decouple modules, allow modules to export reusable services
- Examples: `UsersService` exported from `UsersModule`, used by `AuthModule` for auth checks
- Pattern: Services use constructor dependency injection; modules use `exports: [ServiceName]`

**Tenant Context:**
- Purpose: Multi-tenant support - isolate data/behavior per town/tenant
- Examples: `TenantInterceptor` extracts slug, stores `tenantId` and `tenantSlug` on request
- Pattern: Request-scoped context passed through request object (`request[TENANT_ID_KEY]`)
- Usage: Modules can access tenant context via `@Req()` decorator in controllers

**Guard Pattern (via Passport):**
- Purpose: Protect routes based on authentication/authorization
- Examples: `JwtStrategy`, `GoogleStrategy`, `LocalStrategy` in `src/modules/auth/strategies/`
- Pattern: Passport strategies handle different auth methods; guards applied to controller routes

## Entry Points

**Main Application Entry:**
- Location: `src/main.ts`
- Triggers: Application startup
- Responsibilities: 
  - Bootstrap NestFactory
  - Enable CORS
  - Set global prefix to `/api`
  - Register global `ValidationPipe` with configuration
  - Register `AllExceptionsFilter` for error handling
  - Register `LoggingInterceptor` for request logging
  - Setup Swagger documentation at `/api/docs`
  - Start HTTP server on configured port

**Root Module:**
- Location: `src/app.module.ts`
- Triggers: When NestFactory creates application
- Responsibilities:
  - Register `ConfigModule` with environment validation
  - Setup TypeORM connection with async configuration
  - Import all 25+ feature modules
  - Register `TenantInterceptor` as global interceptor

**Feature Module Entry Points (examples):**
- `src/modules/users/users.module.ts` - Imports User, UserPoint entities; exports UsersService
- `src/modules/auth/auth.module.ts` - Imports JwtModule, UsersModule; provides authentication strategies
- `src/modules/places/places.module.ts` - Imports Place, PlaceImage, Category, Facility entities

## Error Handling

**Strategy:** Centralized exception filtering with HTTP status mapping

**Patterns:**
- All exceptions bubble to `AllExceptionsFilter` in `src/modules/common/filters/all-exceptions.filter.ts`
- Filter distinguishes between:
  - `HttpException`: Already-handled NestJS exceptions (preserves status code)
  - `QueryFailedError`: Database errors (e.g., unique constraint violations → 422 Unprocessable Entity)
  - Generic errors: Logs and returns 500 Internal Server Error
- Error response format includes:
  ```json
  {
    "statusCode": 400,
    "path": "/api/users",
    "errorType": "BadRequestException",
    "timestamp": "2026-04-24T...",
    "errorMessage": "...",
    "errors": { "field": { "message": "...", "value": "..." } }
  }
  ```
- Validation errors are automatically caught by `ValidationPipe` before reaching service layer

## Cross-Cutting Concerns

**Logging:**
- Approach: `LoggingInterceptor` in `src/modules/common/middlewares/`
- Logs all incoming HTTP requests and outgoing responses
- Logger instance created with module name for context identification

**Validation:**
- Approach: Class-validator with `ValidationPipe` globally enabled in `main.ts`
- DTOs decorated with `@IsString()`, `@IsEmail()`, `@IsOptional()`, etc.
- Configuration in `src/config/validation-pipe.config.ts` enables `skipMissingProperties`, `transform`, `whitelist`

**Authentication:**
- Approach: Passport.js with multiple strategies
- JWT strategy for stateless auth with access tokens
- Google OAuth for third-party authentication
- Local strategy for username/password
- Optional JWT strategy allows public access when no token provided
- Session entity persists login sessions in database

**Configuration Management:**
- Approach: `@nestjs/config` with environment variables and Joi schema validation
- Global config module loaded from `src/config/app-config.ts`
- Environment variables validated against schema in `src/config/joi-validation.schema.ts`
- Secrets managed via `.env` (not committed to git)

**Tenant Resolution:**
- Approach: `TenantInterceptor` extracts tenant slug from request header or origin
- Stored on request object for access throughout request lifecycle
- Allows same API instance to serve multiple towns/tenants

---

*Architecture analysis: 2026-04-24*
