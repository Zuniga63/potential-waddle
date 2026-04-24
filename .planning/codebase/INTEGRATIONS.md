# External Integrations

**Analysis Date:** 2026-04-24

## APIs & External Services

**AI & LLM Services:**
- Claude (Anthropic) - Advanced text analysis for reviews and content
  - SDK/Client: `@anthropic-ai/sdk` 0.40.1
  - Auth: `ANTHROPIC_API_KEY`
  - Location: `src/modules/ai/lib/anthropic/`
  
- Google Gemini - Conversational AI and content generation
  - SDK/Client: `@google/generative-ai` 0.24.1
  - Auth: `GEMINI_API_KEY`
  - Model used: `gemini-2.0-flash`
  - Location: `src/modules/rafa/services/llm.service.ts`

- OpenAI - Text embeddings and chat
  - SDK/Client: `openai` 6.15.0
  - Auth: `OPENAI_API_KEY`
  - Models: `text-embedding-3-small` for embeddings via LangChain
  - Location: `src/modules/pinecone/pinecone.service.ts`

**Search & Data Scraping:**
- Google Places API - Location and place data
  - Auth: `GOOGLE_PLACES_API_KEY`
  - Location: `src/modules/google-places/`
  - Used for: Place information, reviews, business data

- Google Routes API - Navigation and routing
  - Auth: `GOOGLE_ROUTES_API_KEY`
  - Config: `src/config/app-config.ts`

- SerpAPI - Search results scraping
  - Auth: `SERP_API_KEY`
  - Config: `src/config/app-config.ts`

- Apify - Web scraping and data extraction
  - Auth: `APIFY_API_KEY`
  - Config: `src/config/app-config.ts`

**Search & Indexing:**
- Google Cloud Indexing API - URL indexing for search engines
  - Auth: `INDEXING_API_KEY`
  - Config: `src/config/app-config.ts`

**Location & Maps:**
- Kmizen - Custom mapping/location service
  - Auth: `KMIZEN_API_KEY`
  - Config: `KMIZEN_BASE_URL`, `KMIZEN_SCHEMA_ID`
  - Location: `src/config/app-config.ts`

## Data Storage

**Databases:**
- PostgreSQL (primary)
  - Connection: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - Client: TypeORM 0.3.20
  - Location: `src/config/type-orm.config.ts`
  - Driver: `pg` 8.12.0
  - Migrations: `src/migrations/` directory

**File Storage:**
- Google Cloud Storage (primary)
  - Bucket: `GCP_BUCKET_NAME` (default: `binntu-documents`)
  - Credentials: `GOOGLE_APPLICATION_CREDENTIALS_JSON` (service account JSON)
  - Base URL: `GOOGLE_CLOUD_STORAGE_BASE_URL` (default: `https://storage.googleapis.com`)
  - Client: `@google-cloud/storage` 7.18.0
  - Location: `src/modules/documents/services/gcp-storage.service.ts`
  - Folder structure: `documents/{townSlug}/{entityType}/{entityId}/{folder}/{fileName}`

- Cloudinary (media delivery & transformation)
  - Cloud name: `CLOUDINARY_CLOUD_NAME`
  - Auth: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Client: `cloudinary` 2.4.0
  - Location: `src/modules/cloudinary/cloudinary.service.ts`
  - Used for: Images, videos with presets and transformations

**Vector Database:**
- Pinecone (vector embeddings for semantic search)
  - API Key: `PINECONE_API_KEY`
  - Environment: `PINECONE_ENVIRONMENT`
  - Indices:
    - `PINECONE_INDEX_BINNTU_GOOGLE_REVIEW` - Google reviews embeddings
    - `PINECONE_INDEX_RAFA_CLAUDE` - Claude-generated embeddings
    - `PINECONE_INDEX_VECTORIZED_DATA` - General vectorized data (default: `rafa-vectorized-data`)
  - Client: `@pinecone-database/pinecone` 5.1.2
  - Location: `src/modules/pinecone/`
  - Embedding model: OpenAI's `text-embedding-3-small`

**Image Processing:**
- Tinify (TinyPNG/TinyJPG) - Image compression
  - Auth: `TINYIFY_API_KEY`
  - Enabled: `TINYIFY_API_KEY` presence
  - Client: `tinify` 1.7.1
  - Location: `src/modules/tinify/tinify.service.ts`
  - Supports: WebP and JPEG conversion

**Caching:**
- None detected in current stack

## Authentication & Identity

**Auth Provider:**
- Multi-strategy custom implementation

**Implementation:**
- JWT (JSON Web Tokens) for API authentication
  - Strategy: `JwtStrategy` in `src/modules/auth/strategies/jwt.strategy.ts`
  - Extraction: Bearer token from Authorization header
  - Config: `JWT_SECRET`, `JWT_EXPIRES_IN` (default: 30 days)
  - Implementation: `@nestjs/jwt` 10.2.0 + `passport-jwt` 4.0.1

- Local (username/password)
  - Strategy: `LocalStrategy` in `src/modules/auth/strategies/local.strategy.ts`
  - Implementation: `passport-local` 1.0.0
  - Password hashing: bcrypt 5.1.1

- Google OAuth 2.0
  - Strategy: `GoogleStrategy` in `src/modules/auth/strategies/google.strategy.ts`
  - Client ID: `GOOGLE_CLIENT_ID`
  - Client Secret: `GOOGLE_CLIENT_SECRET`
  - Callback URL: `GOOGLE_CALLBACK_URL`
  - Implementation: `passport-google-oauth20` 2.0.0 + `google-auth-library` 9.14.0
  - Location: `src/modules/auth/`

- Optional JWT (for public endpoints)
  - Strategy: `OptionalJwtStrategy` for endpoints that accept but don't require auth
  - Location: `src/modules/auth/strategies/optional-jwt.strategy.ts`

**Auth Configuration:**
- `@nestjs/passport` 10.0.3 for Passport.js integration
- Config location: `src/modules/auth/auth.module.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected in current stack

**Logs:**
- Console logging via NestJS Logger
- Used throughout services (e.g., `src/modules/email/services/resend.service.ts`, `src/modules/documents/services/gcp-storage.service.ts`)

**Analytics:**
- Custom analytics module with BigQuery data export
- Location: `src/modules/analytics/`
- Auth: `ANALYTICS_API_KEY`
- Purpose: Flat data export for analytics pipeline

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase (assumes external deployment)

**CI Pipeline:**
- None detected in codebase (likely external)

**Build Output:**
- `dist/` directory (compiled JavaScript)

## Environment Configuration

**Required env vars:**
- `JWT_SECRET` - Required for JWT token signing
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Image hosting
- `RESEND_API_KEY` - Email delivery
- `GOOGLE_PLACES_API_KEY` - Place data
- `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT` - Vector database
- `OPENAI_API_KEY` - Embeddings
- `ANTHROPIC_API_KEY` - Claude API
- `GEMINI_API_KEY` - Google Gemini
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` or default GCP credentials - Cloud Storage
- `GCP_BUCKET_NAME` - Storage bucket

**Optional env vars:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` - Google OAuth
- `TINYIFY_API_KEY` - Image compression
- `TURNSTILE_SECRET_KEY` - CloudFlare CAPTCHA
- `SERP_API_KEY`, `APIFY_API_KEY` - Web scraping
- `KMIZEN_API_KEY`, `KMIZEN_BASE_URL`, `KMIZEN_SCHEMA_ID` - Custom mapping
- `RESEND_FROM_EMAIL` - Email sender (default: `Binntu <noreply@binntu.com>`)
- `FRONTEND_URL` - Frontend application URL (for redirects)

**Secrets location:**
- `.env` file (not committed, listed in `.gitignore`)
- Example template: `.env.example` with placeholder values

## Webhooks & Callbacks

**Incoming:**
- None detected in current stack

**Outgoing:**
- Email callbacks from Resend (implicit in transactional emails)
  - Location: `src/modules/email/`
  - Sends: Welcome emails, password reset emails

**Callback URLs:**
- Google OAuth callback: `GOOGLE_CALLBACK_URL`
- Password reset frontend link: `FRONTEND_URL/auth/reset-password?token={token}`

## WebSocket Integration

**Framework:**
- Socket.io 4.8.0
- NestJS WebSocket support via `@nestjs/websockets` 10.4.4
- Platform adapter: `@nestjs/platform-socket.io` 10.4.4

**Usage:**
- Real-time communication (specific implementation in relevant modules)

---

*Integration audit: 2026-04-24*
