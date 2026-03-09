# Analytics API for BigQuery (Kmizen Sync)

## Resumen
Modulo de analytics que expone 21 endpoints GET con datos 100% planos para sincronizar a Google BigQuery via Kmizen. Cada endpoint = 1 tabla en BigQuery.

## Configuracion (.env binntu-nest)
```
ANALYTICS_API_KEY=c3b4e01be2464e6a91b164b0a6ca0ab423e028baaecda9b2a2b406f8eda6c494
```

## Autenticacion
- Header: `X-API-Key`
- Guard custom: `ApiKeyGuard` valida contra `analytics.apiKey` del ConfigService
- Decorator: `@ApiKeyAuth()` combina guard + swagger security

## Archivos del Backend (binntu-nest)

| Archivo | Proposito |
|---------|-----------|
| `src/modules/analytics/analytics.module.ts` | Modulo con TypeOrmModule.forFeature de 9 entidades |
| `src/modules/analytics/analytics.controller.ts` | 21 endpoints GET bajo `/api/analytics/` |
| `src/modules/analytics/analytics.service.ts` | Logica: queries con TypeORM + raw SQL para pivots |
| `src/modules/analytics/guards/api-key.guard.ts` | Guard de API Key |
| `src/modules/analytics/decorators/api-key-auth.decorator.ts` | Decorator combinado |
| `src/modules/analytics/dto/analytics-pagination.dto.ts` | page (default 1), per_page (default 1000, max 5000) |

## Config modificados
- `src/config/app-config.ts` — `analytics: { apiKey }`
- `src/config/joi-validation.schema.ts` — `ANALYTICS_API_KEY`
- `src/config/swagger-tags.enum.ts` — `Analytics = 'Analytics'`
- `src/config/swagger.config.ts` — `.addApiKey()` + tag
- `src/app.module.ts` — `AnalyticsModule` registrado

## 21 Endpoints

### Entidades (6) — TypeORM findAndCount con relaciones
| Endpoint | Entidad | Relaciones cargadas |
|----------|---------|---------------------|
| `GET /api/analytics/lodgings` | Lodging | town.department, user, images.imageResource, lodgingRoomTypes |
| `GET /api/analytics/restaurants` | Restaurant | town.department, user, place, images.imageResource, menus |
| `GET /api/analytics/experiences` | Experience | town.department, guide, images.imageResource |
| `GET /api/analytics/transport` | Transport | town.department, user |
| `GET /api/analytics/commerces` | Commerce | town.department, user, images.imageResource, products |
| `GET /api/analytics/guides` | Guide | user, images.imageResource, experiences, towns |

### Tablas maestras (2)
| Endpoint | Entidad |
|----------|---------|
| `GET /api/analytics/categories` | Category (con imageResource) |
| `GET /api/analytics/facilities` | Facility |

### Tablas de relacion (11) — Raw SQL sobre tablas pivote
| Endpoint | Tabla SQL | Columnas |
|----------|-----------|----------|
| `lodging-categories` | `lodging_category` | lodging_id, category_id |
| `lodging-facilities` | `lodging_facility` | lodging_id, facility_id |
| `restaurant-categories` | `restaurant_category` | restaurant_id, category_id |
| `restaurant-facilities` | `restaurant_facility` | restaurant_id, facility_id |
| `experience-categories` | `experience_category` | experience_id, category_id |
| `experience-facilities` | `experience_facility` | experience_id, facility_id |
| `transport-categories` | `transport_category` | transport_id, category_id |
| `commerce-categories` | `commerce_category` | commerce_id, category_id |
| `commerce-facilities` | `commerce_facility` | commerce_id, facility_id |
| `guide-categories` | `guide_category` | guide_id, category_id |
| `guide-towns` | `guide_town` | guide_id, town_id |

### Menu (2)
| Endpoint | Metodo |
|----------|--------|
| `GET /api/analytics/menus` | findAndCount con restaurant |
| `GET /api/analytics/menu-items` | Raw SQL con jsonb_array_elements lateral join |

## Formato de respuesta (todos)
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "per_page": 1000,
    "total_pages": 3,
    "total_records": 2150
  }
}
```

## Transformaciones clave (datos planos)
- `location` (PostGIS Point) -> `latitude`, `longitude`
- `town` -> `town_id`, `town_name`, `town_slug`, `department_name`
- `user` -> `user_id`, `user_username`, `user_email`
- `images` -> `image_count`, `main_image_url` (order=0)
- ManyToMany (categories/facilities) -> tablas de relacion separadas

## BigQuery Dataset
- Dataset: `kmizen_8cc5413a_ea32_4bd8_8f66_6870fad68a44`
- Tablas se crean como `binntu_<endpoint>` (ej: `binntu_lodgings`)
