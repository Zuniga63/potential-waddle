// BIZ-08: query contract for GET /api/events/analytics/entity.
// entityType is whitelisted via @IsEnum (rejects anything outside the 7 entity types at the
// gate, so it can never reach the resolver's table map as an injection vector — T-17-05).
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityType } from './create-event.dto';

export class EntityAnalyticsQueryDto {
  @ApiProperty({
    description: 'Type of entity the analytics are scoped to',
    enum: EntityType,
    example: 'lodging',
  })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({
    description: 'Entity ID (UUID) — the business whose analytics are requested',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional({
    description: 'Window start (ISO date). Defaults to 30 days before `to`.',
    example: '2026-05-24',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Window end (ISO date). Defaults to now.',
    example: '2026-06-23',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
