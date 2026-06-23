// D-07: geo derived server-side from IP — this DTO MUST NOT accept latitude/longitude/country/city.
// D-04: town_id derived from TenantInterceptor — never from the client body.
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Initial event_type vocabulary (D-02b). Kept as a string enum so adding a type
 * later is a one-line change with no migration (the DB column stays `varchar`).
 * `@IsEnum(EventType)` rejects unknown types at the gate to prevent dashboard
 * pollution (PITFALLS Security).
 */
export enum EventType {
  PAGE_VIEW = 'page_view',
  WHATSAPP_CLICK = 'whatsapp_click',
  PHONE_CLICK = 'phone_click',
  WEB_CLICK = 'web_click',
  MAP_CLICK = 'map_click',
  SHARE = 'share',
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  CATEGORY_VIEWED = 'category_viewed',
}

/**
 * Local mirror of the whatsapp module's EntityType (7 values). Re-declared here to
 * keep the events module self-contained (no cross-module import).
 */
export enum EntityType {
  LODGING = 'lodging',
  RESTAURANT = 'restaurant',
  GUIDE = 'guide',
  EXPERIENCE = 'experience',
  TRANSPORT = 'transport',
  COMMERCE = 'commerce',
  PLACE = 'place',
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Type of event. Must be one of the known event types.',
    enum: EventType,
    example: 'page_view',
  })
  @IsEnum(EventType)
  @IsNotEmpty()
  eventType: EventType;

  @ApiProperty({
    description: 'Type of the entity the event relates to (optional for apex/platform events)',
    enum: EntityType,
    required: false,
    example: 'lodging',
  })
  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType;

  @ApiProperty({
    description: 'Entity ID (UUID)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiProperty({
    description: 'Entity slug for analytics',
    required: false,
    example: 'hotel-campestre-binntu',
  })
  @IsString()
  @IsOptional()
  entitySlug?: string;

  @ApiProperty({
    description: 'Browser session ID (anonymous, client-generated)',
    required: false,
    example: 'abc123-session-xyz',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'Page path the event was emitted from',
    required: false,
    example: '/lodgings/hotel-campestre-binntu',
  })
  @IsString()
  @IsOptional()
  pagePath?: string;

  @ApiProperty({
    description: 'Referrer URL',
    required: false,
    example: 'https://google.com',
  })
  @IsString()
  @IsOptional()
  referrer?: string;

  @ApiProperty({
    description: 'Time spent on page in seconds',
    required: false,
    example: 45,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  timeOnPage?: number;

  @ApiProperty({
    description: 'Free-form event properties. Allowlist-sanitized server-side per event_type.',
    required: false,
    example: { query: 'cabañas', result_count: 12 },
  })
  @IsObject()
  @IsOptional()
  properties?: Record<string, unknown>;
}
