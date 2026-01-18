import { ApiProperty } from '@nestjs/swagger';
import { Payment, PaymentStatus } from '../entities';
import { SubscriptionDto } from './subscription.dto';

export class PaymentDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  userId: string;

  @ApiProperty({ example: 'BINNTU-PAY-1234567890' })
  reference: string;

  @ApiProperty({ example: 16980000 })
  amountInCents: number;

  @ApiProperty({ example: 169800, description: 'Amount formatted (without decimals)' })
  amount: number;

  @ApiProperty({ example: 'COP' })
  currency: string;

  @ApiProperty({ example: 'approved', enum: ['pending', 'approved', 'declined', 'voided', 'error'] })
  status: PaymentStatus;

  @ApiProperty({ example: '12345-abc', required: false })
  wompiTransactionId: string | null;

  @ApiProperty({ example: 'CARD', required: false })
  paymentMethod: string | null;

  @ApiProperty({ example: 'Insufficient funds', required: false })
  failureReason: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  paidAt: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: [SubscriptionDto], required: false })
  subscriptions?: SubscriptionDto[];

  constructor(payment?: Payment) {
    if (!payment) return;
    this.id = payment.id;
    this.userId = payment.userId;
    this.reference = payment.reference;
    this.amountInCents = payment.amountInCents;
    this.amount = Math.round(payment.amountInCents / 100);
    this.currency = payment.currency;
    this.status = payment.status;
    this.wompiTransactionId = payment.wompiTransactionId;
    this.paymentMethod = payment.paymentMethod;
    this.failureReason = payment.failureReason;
    this.paidAt = payment.paidAt;
    this.createdAt = payment.createdAt;
    this.subscriptions = payment.subscriptions?.map(s => new SubscriptionDto(s));
  }
}
