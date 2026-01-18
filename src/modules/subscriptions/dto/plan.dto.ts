import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '../entities';
import { PlanFeatureDto } from './plan-feature.dto';

export class PlanDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ example: 'Pro' })
  name: string;

  @ApiProperty({ example: 'pro' })
  slug: string;

  @ApiProperty({ example: 'Para negocios que quieren destacar y crecer más rápido.' })
  description: string | null;

  @ApiProperty({ example: 9990000, description: 'Price in cents (COP)' })
  priceInCents: number;

  @ApiProperty({ example: 99900, description: 'Price formatted (without decimals)' })
  price: number;

  @ApiProperty({ example: 'COP' })
  currency: string;

  @ApiProperty({ example: 'monthly' })
  billingInterval: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ type: [PlanFeatureDto], required: false })
  features?: PlanFeatureDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;

  constructor(plan?: Plan) {
    if (!plan) return;
    this.id = plan.id;
    this.name = plan.name;
    this.slug = plan.slug;
    this.description = plan.description;
    this.priceInCents = plan.priceInCents;
    this.price = Math.round(plan.priceInCents / 100);
    this.currency = plan.currency;
    this.billingInterval = plan.billingInterval;
    this.isActive = plan.isActive;
    this.sortOrder = plan.sortOrder;
    this.features = plan.features?.map(f => new PlanFeatureDto(f));
    this.createdAt = plan.createdAt?.toISOString();
    this.updatedAt = plan.updatedAt?.toISOString();
  }
}
