import { ApiProperty } from '@nestjs/swagger';
import { PlanFeature } from '../entities';

export class PlanFeatureDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ example: 'max_photos' })
  featureKey: string;

  @ApiProperty({ example: 'Galería de fotos' })
  featureName: string;

  @ApiProperty({ example: { limit: 10 } })
  featureValue: Record<string, any> | null;

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  constructor(feature?: PlanFeature) {
    if (!feature) return;
    this.id = feature.id;
    this.featureKey = feature.featureKey;
    this.featureName = feature.featureName;
    this.featureValue = feature.featureValue;
    this.isEnabled = feature.isEnabled;
    this.sortOrder = feature.sortOrder;
  }
}
