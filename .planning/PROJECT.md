# Binntu Nest (Backend)

## What This Is

Backend NestJS API for Binntu — una plataforma de turismo/destinos que conecta usuarios con lugares (places), restaurantes, alojamientos, experiencias, transportes, guías turísticos y guías editoriales. Provee la capa de datos, autenticación, e integraciones (IA, pagos, emails, almacenamiento de medios) para el frontend de Binntu.

## Core Value

Ser la fuente de verdad confiable y segura para el contenido y las interacciones de usuarios en la plataforma Binntu — integridad de datos (especialmente en operaciones multi-entidad y multi-tenant) sobre cualquier otra consideración.

## Requirements

### Validated

<!-- Capacidades existentes en el código — inferidas desde .planning/codebase/ -->

- ✓ **Autenticación multi-estrategia** — local (email/password), Google OAuth, JWT sessions — `src/modules/auth/`
- ✓ **Usuarios y roles** — cuentas, perfiles, permisos, super-admin — `src/modules/users/`, `src/modules/roles/`
- ✓ **Multi-tenant** — interceptor/middleware de tenant, scoping por request — migration `AddMultiTenantSupport`
- ✓ **Gestión de contenido turístico** — places, restaurants, lodgings, experiences, transport, public-events, towns — 7 módulos de dominio
- ✓ **Guías turísticos (Guide)** — entidad persona (document, email, nombres) con endpoints `POST /guides` y upload de imágenes
- ✓ **Guías editoriales** — contenido tipo artículos (también en `guides/` junto a la entidad Guide persona)
- ✓ **Reviews con agregación** — reseñas sobre 6 tipos de entidades con cálculo de rating — `src/modules/reviews/`
- ✓ **Commerce** — productos, órdenes, checkout — `src/modules/commerce/`
- ✓ **Subscriptions** — membresías recurrentes — `src/modules/subscriptions/`
- ✓ **Promotions** — descuentos y códigos promocionales
- ✓ **Badges** — sistema de insignias (migration `AddBadgesTable`, Feb 2026)
- ✓ **Integración de IA** — Claude, Gemini, OpenAI para contenido generado, Pinecone para embeddings — `src/modules/ai/`, `src/modules/pinecone/`
- ✓ **Google Places** — enriquecimiento de datos de lugares — `src/modules/google-places/`
- ✓ **Storage de medios** — Cloudinary (principal), GCP Storage (configurado), Tinify (compresión)
- ✓ **Email transaccional** — Resend — `src/modules/email/`
- ✓ **CAPTCHA** — Cloudflare Turnstile — `src/modules/turnstile/`
- ✓ **Analytics** — puente a BigQuery — `src/modules/analytics/` (commit `cc97c12`)
- ✓ **Mapas y geolocalización** — `src/modules/map/`, utilidades `circular-area.ts`
- ✓ **WhatsApp click tracking** — `src/modules/whatsapp-clicks/`
- ✓ **Documents** — manejo de documentos de negocio — `src/modules/documents/` (plantillas y exclusiones de categoría)
- ✓ **Seeds** — importación masiva de datos — `src/modules/seeds/`
- ✓ **Dashboard admin** — vistas de analítica administrativa — `src/modules/dashboard/`
- ✓ **Swagger/OpenAPI** — documentación auto-generada — `src/config/swagger.config.ts`
- ✓ **Validación de ENV** — Joi schema en bootstrap — `src/config/joi-validation.schema.ts`

### Active

<!-- Milestone actual: Terms & Conditions acceptance -->

- [ ] **Backend de Terms & Conditions** — 2 tablas nuevas (`terms_documents`, `terms_acceptances`), enum de 6 tipos (`user`, `lodging`, `restaurant`, `commerce`, `transport`, `guide`)
- [ ] **Endpoints admin T&C** — CRUD + activación + listar aceptaciones (bajo `SuperAdminGuard`)
- [ ] **Endpoints públicos/auth T&C** — `GET /terms/active`, `POST /terms/:id/accept` (idempotente), `GET /terms/me/status`
- [ ] **Signup bloqueante** — extender `POST /auth/local/signup` con `acceptedUserTermsId` requerido (crea aceptación en la misma transacción)
- [ ] **Guard en endpoints de negocio** — 403 `TERMS_NOT_ACCEPTED` en `POST /lodgings`, `POST /restaurants`, `POST /commerce`, `POST /transport`, `POST /guides` cuando el usuario no tiene aceptación activa del tipo correspondiente
- [ ] **`termsStatus` en sesión** — extender `GET /auth/profile` con el objeto `termsStatus` (6 booleanos + `activeDocumentIds`)
- [ ] **Upload de PDF T&C** — soporte `format: markdown | pdf` en documentos admin, PDFs a Cloudinary, validación MIME + tamaño (5MB)
- [ ] **Auditoría inmutable** — captura server-side de IP + User-Agent (decorador `@Ip()` ya usado), sin PATCH/DELETE sobre `terms_acceptances`
- [ ] **Seeds iniciales** — 6 documentos placeholder activos (uno por tipo) para que el frontend pueda probar
- [ ] **Tests** — idempotencia de aceptación, transacción de activación-desactivación, guard de admin, flujo signup-with-terms, flujo business-creation-blocked

### Out of Scope

- **Versionado de documentos T&C** — solo un puntero `is_active` es suficiente por ahora; editar activo NO requiere re-aceptación
- **Re-aceptación automática al editar** — explícitamente excluido por decisión de producto; cambios menores no invalidan aceptaciones previas
- **T&C per-tenant** — los 6 documentos son globales para toda la plataforma; sin `tenant_id` en las tablas nuevas
- **T&C para experiences, places, public-events, promotions** — fuera del scope actual (se puede agregar más adelante como nuevo tipo)
- **PATCH/DELETE sobre `terms_acceptances`** — registros inmutables excepto por tooling de soporte legal explícito
- **Escaneo antivirus de PDFs** — no hay infraestructura; validación se limita a MIME + size

## Context

**Tipo de proyecto:** Brownfield — backend existente en producción con ~35 módulos y uso activo del frontend. Este milestone es una feature puntual (T&C) que se integra al sistema vivo.

**Driver de negocio:** El frontend necesita bloquear registro y creación de negocios sin aceptación previa, y los admin necesitan subir/editar los documentos legales. Feature con componente legal → auditoría inmutable y captura server-side de IP/UA son no-negociables.

**Estado de la deuda técnica relevante** (ver `.planning/codebase/CONCERNS.md`):
- Algunas escrituras multi-entidad NO están envueltas en transacciones → para T&C es crítico: `POST /auth/local/signup` con aceptación, y `POST /admin/terms/:id/activate` (desactivar previo + activar nuevo).
- Cobertura de tests es casi nula → este milestone agregará tests de integración.
- Scoping de tenant es inconsistente → T&C son globales, así que no aplica, pero hay que asegurar que la feature NO introduzca dependencia accidental a tenant context.

**Spec de entrada:** El frontend entregó un spec completo (BACKEND-SPEC.md) con tablas, endpoints, shapes de request/response y una checklist de integración. Ver `.planning/` (referencia de handoff).

## Constraints

- **Tech stack:** Node.js 20, NestJS 10, TypeScript 5.5, TypeORM, PostgreSQL, pnpm — no cambiar.
- **Storage de medios:** Cloudinary es el proveedor principal; PDFs de T&C van a Cloudinary.
- **Auth:** JWT (local + Google OAuth) ya establecido; reutilizar guards existentes (`JwtAuthGuard`, `SuperAdminGuard`).
- **Multi-tenant:** existe a nivel de plataforma pero NO aplica a T&C (documentos globales por tipo).
- **Compatibilidad de API:** extender `GET /auth/profile` agregando `termsStatus` — NO remover/renombrar campos existentes para no romper frontend actual.
- **Migrations:** timestamp-prefijadas, convención actual; correr en orden; reversibles cuando sea posible.
- **Seguridad:** IP + User-Agent capturados server-side (`@Ip()` decorator ya usado); aceptación inmutable; MIME y tamaño validados en upload de PDF.
- **Captura legal:** `terms_acceptances` es append-only — sin UPDATE/DELETE endpoints.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| T&C globales (sin tenant_id) | Son documentos legales de la plataforma; un conjunto de 6 tipos sirve a todos los tenants | — Pending |
| PDFs en Cloudinary | Ya integrado y es el storage dominante del backend; soporta PDFs | — Pending |
| Path `/terms/me/status` (bajo `/terms/*`) vs. `/auth/profile/terms-status` | Mantiene todos los endpoints de T&C agrupados en Swagger, más descubrible | — Pending |
| Extender `GET /auth/profile` con `termsStatus` + endpoint ligero `/terms/me/status` | Bootstrap inicial sin round-trip extra (profile) + re-checks baratos (endpoint dedicado); mismo shape para un adapter único en frontend | — Pending |
| `guide` en T&C = entidad `Guide` existente (guía turístico persona) | No es "contenido editorial"; es la persona con document/email — el guard se engancha a `POST /guides` existente | — Pending |
| Signup y activación envueltos en transacción | Integridad de datos: usuario sin su aceptación, o activación con dos docs activos simultáneos, son estados inválidos | — Pending |
| Aceptación idempotente por `(user_id, terms_document_id)` unique | Retries de red no deben duplicar registros ni romper; retornar registro existente en conflicto | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-24 after initialization (T&C milestone)*
