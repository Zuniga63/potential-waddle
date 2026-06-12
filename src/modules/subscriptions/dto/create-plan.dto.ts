import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, Min, MaxLength, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export const PLAN_ENTITY_TYPES = ['lodging', 'restaurant', 'commerce', 'transport', 'guide', 'experience'] as const;
export type PlanEntityType = (typeof PLAN_ENTITY_TYPES)[number];

export class CreatePlanFeatureDto {
  @ApiProperty({ example: 'max_photos', description: 'Feature key identifier' })
  @IsString()
  @MaxLength(100)
  featureKey: string;

  @ApiProperty({ example: 'Galería de fotos', description: 'Feature display name' })
  @IsString()
  @MaxLength(255)
  featureName: string;

  @ApiPropertyOptional({ example: { limit: 10 }, description: 'Feature configuration value' })
  @IsOptional()
  featureValue?: Record<string, any>;

  @ApiProperty({ example: true, description: 'Is feature enabled' })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'Pro', description: 'Plan name' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'pro', description: 'Plan slug (URL-friendly)' })
  @IsString()
  @MaxLength(50)
  slug: string;

  @ApiPropertyOptional({ example: 'Plan description', description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 9990000, description: 'Price in cents (e.g., 9990000 = $99,900 COP)' })
  @IsInt()
  @Min(0)
  priceInCents: number;

  @ApiPropertyOptional({ example: 'COP', description: 'Currency code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 'monthly', description: 'Billing interval' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingInterval?: string;

  @ApiPropertyOptional({ example: true, description: 'Is plan active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    example: ['lodging', 'restaurant'],
    enum: PLAN_ENTITY_TYPES,
    isArray: true,
    description: 'Business entity types this plan applies to. Empty array means "applies to all".',
  })
  @IsOptional()
  @IsArray()
  @IsIn(PLAN_ENTITY_TYPES as unknown as string[], { each: true })
  entityTypes?: PlanEntityType[];

  @ApiPropertyOptional({ type: [CreatePlanFeatureDto], description: 'Plan features' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanFeatureDto)
  features?: CreatePlanFeatureDto[];
}
