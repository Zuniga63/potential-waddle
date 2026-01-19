import { ApiProperty } from '@nestjs/swagger';
import { Subscription, SubscriptionStatus, EntityType } from '../entities';
import { PlanDto } from './plan.dto';

export class SubscriptionDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  userId: string;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  planId: string;

  @ApiProperty({ type: PlanDto, required: false })
  plan?: PlanDto;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', required: false })
  paymentId: string | null;

  @ApiProperty({ example: 'active', enum: ['pending', 'active', 'canceled', 'past_due', 'expired'] })
  status: SubscriptionStatus;

  @ApiProperty({ example: 'lodging', enum: ['lodging', 'restaurant', 'commerce', 'transport', 'guide'] })
  entityType: EntityType;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  entityId: string;

  @ApiProperty({ example: 'Hotel San Rafael' })
  entityName: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  currentPeriodStart: Date;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  currentPeriodEnd: Date;

  @ApiProperty({ example: null, required: false })
  canceledAt: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: true, description: 'If the subscription is currently active' })
  isActive: boolean;

  @ApiProperty({ example: 15, description: 'Days remaining in current period' })
  daysRemaining: number;

  @ApiProperty({ example: false, description: 'If the subscription has expired' })
  isExpired: boolean;

  @ApiProperty({ example: 'Wompi', description: 'Payment type: Wompi or Manual' })
  paymentType: 'Wompi' | 'Manual';

  constructor(subscription?: Subscription) {
    if (!subscription) return;
    this.id = subscription.id;
    this.userId = subscription.userId;
    this.planId = subscription.planId;
    this.plan = subscription.plan ? new PlanDto(subscription.plan) : undefined;
    this.paymentId = subscription.paymentId;
    this.status = subscription.status;
    this.entityType = subscription.entityType;
    this.entityId = subscription.entityId;
    this.entityName = subscription.entityName;
    this.currentPeriodStart = subscription.currentPeriodStart;
    this.currentPeriodEnd = subscription.currentPeriodEnd;
    this.canceledAt = subscription.canceledAt;
    this.createdAt = subscription.createdAt;

    const now = new Date();
    this.isExpired = now > subscription.currentPeriodEnd;
    this.isActive = subscription.status === 'active' && !this.isExpired;
    this.daysRemaining = Math.max(0, Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Determinar tipo de pago
    if (!subscription.paymentId) {
      this.paymentType = 'Manual';
    } else if (subscription.payment?.wompiTransactionId) {
      this.paymentType = 'Wompi';
    } else {
      this.paymentType = 'Manual';
    }
  }
}
