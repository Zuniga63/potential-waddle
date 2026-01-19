import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

import { EntityType, SubscriptionStatus } from '../entities';

export class AdminCreateSubscriptionDto {
  @ApiProperty({ example: 'uuid', description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'uuid', description: 'Plan ID' })
  @IsUUID()
  planId: string;

  @ApiProperty({ example: 'lodging', enum: ['lodging', 'restaurant', 'commerce', 'transport', 'guide'] })
  @IsEnum(['lodging', 'restaurant', 'commerce', 'transport', 'guide'])
  entityType: EntityType;

  @ApiProperty({ example: 'uuid', description: 'Entity ID' })
  @IsUUID()
  entityId: string;

  @ApiProperty({ example: 'Hotel Example', description: 'Entity name' })
  @IsString()
  @MaxLength(255)
  entityName: string;

  @ApiPropertyOptional({ example: 'active', enum: ['pending', 'active', 'canceled', 'past_due', 'expired'] })
  @IsOptional()
  @IsEnum(['pending', 'active', 'canceled', 'past_due', 'expired'])
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Period start date' })
  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', description: 'Period end date' })
  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;
}
