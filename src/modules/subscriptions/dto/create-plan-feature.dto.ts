import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, IsUUID, Min, MaxLength } from 'class-validator';

export class CreatePlanFeatureDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', description: 'Plan ID' })
  @IsUUID()
  planId: string;

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

export class UpdatePlanFeatureDto extends PartialType(CreatePlanFeatureDto) {}
