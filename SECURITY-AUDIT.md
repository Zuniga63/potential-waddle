# Auditoria de Seguridad — Extraccion de cartas (Phase 8)

**Fecha:** 2026-06-20
**Repositorio:** binntu-nest
**Alcance:** Feature de extraccion de cartas (menu extraction) — endpoints POST upload y DELETE menu

---

## SEC-01 — Rotacion de credenciales

**Estado: HECHO**

Las credenciales KMIZEN_API_KEY y la service-account de GCS han sido rotadas por el usuario y movidas al secret store de Railway. No existen literales de clave en el codigo fuente.

### Evidencia — lectura via process.env (sin literales hardcodeados)

Comando ejecutado:
```
grep -rn 'KMIZEN_API_KEY\|GOOGLE_APPLICATION_CREDENTIALS_JSON\|ANTHROPIC' \
  src/config/app-config.ts \
  src/modules/documents/services/gcp-storage.service.ts
```

Resultado:
```
src/config/app-config.ts:147:    apiKey: process.env.ANTHROPIC_API_KEY || '',
src/config/app-config.ts:148:    model: process.env.ANTHROPIC_MODEL || '',
src/config/app-config.ts:176:    apiKey: process.env.KMIZEN_API_KEY || '',
src/modules/documents/services/gcp-storage.service.ts:33:    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
src/modules/documents/services/gcp-storage.service.ts:44:        this.logger.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
```

Interpretacion: todos los secretos se leen via `process.env`; sin literales de clave real en el codigo.

### Evidencia — scan de literales de api key sospechosos

Comando ejecutado:
```
grep -rniE "apikey\s*[:=]\s*['\"][A-Za-z0-9_-]{16,}" src --include=*.ts | grep -v spec
```

Resultado: (sin salida — ningun literal sospechoso encontrado)

---

## SEC-02 — Auth + Ownership

**Estado: HECHO**

El guard `RestaurantMenuAccessGuard` fue implementado y cableado en `menu.controller.ts` sobre los endpoints `POST upload` y `DELETE :menuId` (commit `3ec257b`).

### Logica del guard

Acceso permitido si se cumple alguna condicion:
- `user.isSuperUser === true` (super-admin)
- `restaurant.user?.id === user.id` (dueno del restaurante)
- `restaurant.town?.id` esta en `user.towns` (admin del municipio)

En cualquier otro caso: `ForbiddenException('No tienes permiso para gestionar la carta de este restaurante')` antes de tocar GCS ni Claude.

### Cobertura de tests

Spec anadido en este plan: `src/modules/restaurants/guards/restaurant-menu-access.guard.spec.ts` (commit `60631e4`, 7 casos):
- super-admin -> true
- owner -> true
- town-admin -> true
- outsider -> ForbiddenException (403)
- sin user en request -> ForbiddenException + repositorio no consultado
- restaurant inexistente -> NotFoundException (404)
- verificacion de relations { user: true, town: true }

### Nota: rate-limit / throttler DESCOPEADO

Por decision explicita del usuario (D-02, 2026-06-20), `@nestjs/throttler` queda fuera de scope. Razon: el upload es one-time-per-cliente y la idempotencia `restaurantId + fileHash` (Phase 7) evita doble cobro del mismo archivo. SEC-02 se satisface via auth + ownership. Reconsiderar si el upload se vuelve self-service masivo.

---

## SEC-03 — Redaccion de logs

**Estado: HECHO**

El servicio `AnthropicMenuExtractionService` loguea unicamente metadata del archivo (`originalname`, `mimetype`, `size` en bytes). Nunca se loguea `file.buffer` ni contenido base64 del archivo.

### Referencia en el codigo

```
// src/modules/restaurants/services/anthropic-menu-extraction.service.ts:93
// 3. Log metadata ONLY — never log file.buffer or any base64 content (SEC-03)
this.logger.log(`Extracting menu: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
```

La funcion `renderPdfToImageBlocks()` produce base64 internamente (linea ~206) para enviar a Anthropic, pero ese buffer nunca cruza a las llamadas de `this.logger`.

### Cobertura de tests

Spec anadido en este plan: describe `SEC-03: no base64 in logs` en `anthropic-menu-extraction.service.spec.ts` (commit `bc023e1`, 3 casos):
- Regex `BASE64_BLOB = /[A-Za-z0-9+/]{120,}={0,2}/` con test-guardia anti-falso-verde
- Imagen JPEG: ningun log contiene base64 largo; metadata del archivo si aparece
- PDF pequeno (ruta url-source): ningun log contiene base64 largo

---

## SEC-04 — Auditoria git history

**Estado: HECHO / LIMPIO**

### Evidencia 1 — archivos .env trackeados en git

Comando ejecutado:
```
cd binntu-nest && git ls-files | grep -i '\.env'
```

Resultado:
```
.env.example
```

Interpretacion: unicamente `.env.example` esta trackeado. Ningun archivo `.env` con secretos reales en el repositorio.

### Evidencia 2 — .gitignore cubre .env*

Comando ejecutado:
```
grep -n '\.env' binntu-nest/.gitignore
```

Resultado:
```
40:.env
41:.env.development.local
42:.env.test.local
43:.env.production.local
44:.env.local
```

Interpretacion: las variantes principales de `.env` estan cubiertas en `.gitignore` (lineas 40-44).

### Evidencia 3 — git history sin .env con secretos

Comando ejecutado:
```
cd binntu-nest && git log --all --diff-filter=A --name-only --pretty=format: \
  | grep -E '^\.env' | grep -v '\.env\.example' | sort -u
```

Resultado: (sin salida — history limpio)

Interpretacion: ningun archivo `.env` con secretos fue commiteado en toda la historia del repositorio.

---

## Comandos de verificacion (re-auditoria futura)

```bash
# SEC-04: solo .env.example trackeado
git ls-files | grep -i '\.env'

# SEC-04: .gitignore cubre .env*
grep -n '\.env' .gitignore

# SEC-04: history sin .env con secretos
git log --all --diff-filter=A --name-only --pretty=format: \
  | grep -E '^\.env' | grep -v '\.env\.example' | sort -u

# SEC-01: secretos leidos via process.env (no literales)
grep -rn 'KMIZEN_API_KEY\|GOOGLE_APPLICATION_CREDENTIALS_JSON\|ANTHROPIC' \
  src/config/app-config.ts \
  src/modules/documents/services/gcp-storage.service.ts

# SEC-01: scan de literales de api key sospechosos
grep -rniE "apikey\s*[:=]\s*['\"][A-Za-z0-9_-]{16,}" src --include=*.ts | grep -v spec

# SEC-02: guard cableado en controller
grep -n "UseGuards(RestaurantMenuAccessGuard)" src/modules/restaurants/menu.controller.ts

# SEC-02: throttler NO instalado (D-02 respetado)
grep -rq "@nestjs/throttler\|ThrottlerGuard\|@Throttle" src && echo "FOUND" || echo "OK: sin throttler"

# SEC-03: suite de tests del modulo restaurants
pnpm jest src/modules/restaurants
```
