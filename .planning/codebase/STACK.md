# Technology Stack

**Analysis Date:** 2026-04-24

## Languages

**Primary:**
- TypeScript 5.5.4 - All source code in `src/`
- JavaScript (via Node.js compiled output)

**Secondary:**
- SQL - PostgreSQL database queries via TypeORM

## Runtime

**Environment:**
- Node.js 20.x (specified in `package.json` engines)

**Package Manager:**
- pnpm 9.4.0
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- NestJS 10.4.1 - Primary backend framework
- Express 4.17.21 - Underlying HTTP server (via `@nestjs/platform-express`)

**Testing:**
- Jest 29.7.0 - Test runner
- Supertest 7.0.0 - HTTP assertion library
- ts-jest 29.2.5 - TypeScript support for Jest

**Build/Dev:**
- NestJS CLI 10.4.5 - Project scaffolding and build
- TypeScript 5.5.4 - Compilation
- ts-node 10.9.2 - TypeScript execution for scripts
- ts-loader 9.5.1 - Webpack loader for TypeScript
- Prettier 3.3.3 - Code formatting
- ESLint 8.57.0 - Linting

## Key Dependencies

**Critical:**
- `typeorm` 0.3.20 - ORM for database operations
- `pg` 8.12.0 - PostgreSQL driver
- `@nestjs/typeorm` 10.0.2 - TypeORM integration with NestJS
- `@nestjs/jwt` 10.2.0 - JWT token generation and validation
- `@nestjs/passport` 10.0.3 - Passport.js authentication integration
- `passport` 0.7.0 - Authentication middleware
- `bcrypt` 5.1.1 - Password hashing

**Infrastructure:**
- `@nestjs/config` 3.2.3 - Configuration management
- `dotenv` 16.4.5 - Environment variable loading
- `joi` 17.13.3 - Schema validation for config
- `class-validator` 0.14.1 - DTO/entity validation
- `class-transformer` 0.5.1 - Object transformation
- `rxjs` 7.8.1 - Reactive programming

**AI & Machine Learning:**
- `@anthropic-ai/sdk` 0.40.1 - Claude API for advanced text analysis
- `@google/generative-ai` 0.24.1 - Google Gemini API
- `@langchain/openai` 0.5.7 - LangChain OpenAI integration
- `langchain` 0.3.24 - LLM framework
- `openai` 6.15.0 - OpenAI API client
- `@pinecone-database/pinecone` 5.1.2 - Vector database for embeddings

**Cloud & File Storage:**
- `@google-cloud/storage` 7.18.0 - Google Cloud Storage client
- `cloudinary` 2.4.0 - Image and video delivery service
- `tinify` 1.7.1 - Image compression API

**Authentication:**
- `passport-google-oauth20` 2.0.0 - Google OAuth 2.0 strategy
- `passport-google-oauth` 2.0.0 - Google OAuth strategy
- `passport-jwt` 4.0.1 - JWT authentication strategy
- `passport-local` 1.0.0 - Local username/password strategy
- `google-auth-library` 9.14.0 - Google authentication utilities

**Email & Communication:**
- `resend` 6.5.2 - Email delivery service
- `socket.io` 4.8.0 - WebSocket communication
- `@nestjs/websockets` 10.4.4 - WebSocket integration
- `@nestjs/platform-socket.io` 10.4.4 - Socket.io platform adapter

**HTTP & Networking:**
- `axios` 1.7.7 - HTTP client for API calls
- `@nestjs/axios` 3.0.3 - Axios integration with NestJS

**Data Processing:**
- `form-data` 4.0.5 - FormData construction
- `xlsx` 0.18.5 - Excel file parsing and generation
- `zod` 4.3.5 - TypeScript-first schema validation
- `nanoid` 3.3.7 - Unique ID generation
- `uuid` 11.0.3 - UUID generation

**API Documentation:**
- `@nestjs/swagger` 7.4.0 - OpenAPI/Swagger integration

## Configuration

**Environment:**
- Configuration loaded from environment variables via `ConfigService` from `@nestjs/config`
- Config file location: `src/config/app-config.ts` contains environment variable interface and defaults
- Validation schema: `src/config/joi-validation.schema.ts` uses Joi to validate required and optional vars

**Key Configs Required:**
- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- APIs: `GOOGLE_PLACES_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`
- Services: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `TINYIFY_API_KEY`
- Pinecone: `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, vector database indices
- GCP: `GOOGLE_CLOUD_KEYFILE` (JSON credentials), `GCP_BUCKET_NAME`

**Build:**
- `tsconfig.json` - TypeScript compiler configuration (ES2021 target, CommonJS modules)
- `tsconfig.build.json` - Build-specific TypeScript config
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier code formatting config (120 char line width, 2 space indent)
- `nest-cli.json` - NestJS CLI configuration

## Platform Requirements

**Development:**
- Node.js 20.x
- PostgreSQL 12+ database
- Google Cloud Platform account (for GCP Storage and OAuth)
- Pinecone vector database account
- API keys for: OpenAI, Anthropic, Google Gemini, Cloudinary, Resend, Tinify

**Production:**
- Node.js 20.x runtime
- PostgreSQL database
- Environment variables configured for all external services
- GCP service account credentials (as JSON)
- CloudFlare Turnstile credentials for CAPTCHA

---

*Stack analysis: 2026-04-24*
