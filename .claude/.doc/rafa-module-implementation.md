# Implementación del Módulo Rafa - NestJS

**Fecha**: 2026-01-06
**Estado**: En progreso

## Resumen

Migración del sistema Rafa (asistente turístico de Colombia) de Python (rafa-super-agent-lc) a NestJS. El sistema usa un pipeline de **Classify → Decide → Execute → Respond**.

## Arquitectura

```
Usuario → ChatRequestDto → RafaService
                              ↓
                    1. LlmService.classifyIntent()
                              ↓
                    2. Check INTENT_CONFIG requirements
                              ↓
                    3. ToolsService.executeTool()
                              ↓
                    4. LlmService.generateResponse()
                              ↓
                    ChatResponseDto → Frontend
```

## Archivos Creados

### Entidades (`src/modules/rafa/entities/`)
- `rafa-conversation.entity.ts` - Conversaciones con estado JSONB
- `rafa-message.entity.ts` - Mensajes individuales
- `rafa-lead.entity.ts` - Leads/reservas
- `index.ts` - Barrel export

### DTOs (`src/modules/rafa/dto/`)
- `rafa-intent.enum.ts` - 15 intents + TRIP_STYLES
- `trip-state.dto.ts` - Estado de viaje con Zod schema
- `intent-config.ts` - Configuración de cada intent (requiredFields, tool, minConfidence)
- `classify-output.dto.ts` - Schema Zod para respuesta del LLM
- `chat.dto.ts` - Request/Response DTOs, ChatCard, EntityCardData

### Servicios (`src/modules/rafa/services/`)
- `llm.service.ts` - Gemini 2.0 Flash para clasificación y respuestas
- `tools.service.ts` - Búsquedas SQL y RAG
- `rafa.service.ts` - Orquestador principal

### Controller y Module
- `rafa.controller.ts` - Endpoints POST /chat, GET /conversation/:id, POST /lead
- `rafa.module.ts` - Configuración del módulo

## Intents Soportados

| Intent | Tool | Descripción |
|--------|------|-------------|
| FIND_LODGING | searchLodgings | Buscar hoteles |
| FIND_RESTAURANT | searchRestaurants | Buscar restaurantes |
| FIND_EXPERIENCE | searchExperiences | Buscar experiencias |
| FIND_PLACE | searchPlaces | Buscar lugares mágicos |
| FIND_GUIDE | searchGuides | Buscar guías |
| FIND_TRANSPORT | searchTransport | Buscar transporte |
| FIND_COMMERCE | searchCommerce | Buscar comercios |
| BUILD_ITINERARY | buildItinerary | Crear itinerario (requiere destination, days/dates) |
| ESTIMATE_BUDGET | estimateBudget | Estimar presupuesto |
| CREATE_LEAD | createLead | Crear reserva (requiere contacto) |
| SELECT_ENTITY | selectEntity | Seleccionar de resultados previos |
| GREETING | null | Saludo |
| FAREWELL | null | Despedida |
| GENERAL_QUESTION | ragSearch | Preguntas generales (RAG) |
| UNKNOWN | null | No clasificado |

## LLM Service

**Modelo**: Gemini 2.0 Flash (`gemini-2.0-flash`)

### Clasificación
- Temperature: 0.1
- Response: JSON estructurado
- Normaliza intent a lowercase (Gemini a veces devuelve uppercase)

### Generación de respuesta
- Temperature: 0.7
- Max tokens: 1024
- Personalidad: Rafa, asistente colombiano amigable

## Tools Service

### Búsquedas SQL
Cada búsqueda:
1. Filtra por `townId`, `budgetMin`, `budgetMax`
2. Ordena por rating DESC
3. Limita a 5 resultados
4. Mapea a `ChatCard` con `EntityCardData` completo (imágenes, rating, precio, etc.)

### RAG Search
```typescript
// Namespace hardcodeado de producción (San Rafael)
const PROD_SAN_RAFAEL_NAMESPACE = '3651a959-fb3f-40d3-a455-50004d69e48b';
```

**Lógica de filtrado**:
- MIN_SCORE: 0.35
- HIGH_SCORE: 0.5
- Si el top result es 30%+ mejor que el segundo, solo muestra el top

**Hidratación**: Después de encontrar en Pinecone, busca la entidad completa en la DB para tener imágenes y datos completos.

### Select Entity
Maneja selección por:
- Posición: "el primero", "la segunda opción"
- Nombre: referencia por nombre
- Superlativos: "el más caro", "el más barato", "el mejor valorado"

## Cambios en Frontend (binntu)

**`.env.local`**:
```
NEXT_PUBLIC_RAFA_SUPER_AGENT_LC_URL=http://localhost:8080/api/rafa/chat
```

## Formato de Response

```typescript
interface ChatResponseDto {
  message: string;
  intent: RafaIntent;
  cards: ChatCard[];
  follow_up_questions: string[];
  requires_more_info: boolean;
  conversation_complete: boolean;
  context_update?: UserContext;
  conversation_id: string;
}
```

## Formato de Card (EntityCardData)

```typescript
interface EntityCardData {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  images: EntityImage[];  // { imageResource: { url } }
  rating: number;
  reviewCount?: number;
  lowestPrice?: string;
  highestPrice?: string;
  town?: { id, name, slug };
  categories?: Array<{ id, name }>;
  // ... más campos según tipo
}
```

## Migración de Base de Datos

```bash
pnpm migration:generate src/migrations/CreateRafaTables
pnpm migration:run
```

Tablas creadas:
- `rafa_conversations`
- `rafa_messages`
- `rafa_leads`

## Problemas Resueltos

### 1. Validación UUID
**Problema**: Frontend envía `conv_${Date.now()}` pero DTO tenía `@IsUUID()`
**Solución**: Cambiar a `@IsString()` y validar UUID solo al buscar en DB

### 2. Zod validation - tripStyle/tags null
**Problema**: Gemini devuelve `null` para arrays
**Solución**: `.nullable().optional().transform(v => v ?? [])`

### 3. Intent uppercase
**Problema**: Gemini a veces devuelve `SELECT_ENTITY` en lugar de `select_entity`
**Solución**: `parsed.intent = parsed.intent.toLowerCase()`

### 4. RAG namespace mismatch
**Problema**: Pinecone tiene datos con town_id de producción, local tiene IDs diferentes
**Solución temporal**: Hardcodear el namespace de producción de San Rafael

### 5. Cards sin imágenes en RAG
**Problema**: RAG devolvía metadata básica, no EntityCardData completo
**Solución**: Hidratar resultados RAG buscando entidad completa en DB

## Pendientes / TODO

1. **Sincronizar IDs**: Los entity_id en Pinecone son de prod, la DB local tiene otros IDs
2. **SELECT_ENTITY**: Clasificador no siempre detecta "el más costoso" como SELECT_ENTITY
3. **buildItinerary / estimateBudget**: Tools no implementados
4. **Optimizar RAG**:
   - Actualmente tarda ~10s por la búsqueda de embeddings
   - Considerar cache de embeddings frecuentes
5. **Streaming**: Implementar streaming de respuesta para mejor UX
6. **Tests**: Agregar tests unitarios y e2e

## Variables de Entorno Requeridas

```env
# Gemini
GEMINI_API_KEY=...

# OpenAI (para embeddings)
OPENAI_API_KEY=...

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=rafa-vectorized-data
```

## Comandos Útiles

```bash
# Build
pnpm build

# Dev server
pnpm start:dev

# Test RAG directo
curl -X POST "http://localhost:8080/api/rafa/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "que sabes del hotel rio de oro?"}'

# Test búsqueda SQL
curl -X POST "http://localhost:8080/api/rafa/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "busco hotel en san rafael"}'
```

## Logs de Debug

El sistema tiene logs DEBUG para:
- `[LlmService]` - Raw intent, clasificación
- `[RafaService]` - Intent detectado, tool ejecutado
- `[ToolsService]` - RAG search query, results, scores

## Próximos Pasos Sugeridos

1. Re-vectorizar datos locales para que los IDs coincidan
2. Implementar SELECT_ENTITY más robusto
3. Agregar más tests
4. Considerar cache para embeddings
5. Implementar streaming de respuestas
