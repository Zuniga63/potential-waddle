import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment, PaymentStatus } from '../entities';
import { PaymentDto } from '../dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findByUser(userId: string): Promise<PaymentDto[]> {
    const payments = await this.paymentRepository.find({
      where: { userId },
      relations: { subscriptions: { plan: true } },
      order: { createdAt: 'DESC' },
    });

    return payments.map(payment => new PaymentDto(payment));
  }

  async findOne(id: string): Promise<PaymentDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { subscriptions: { plan: true } },
    });
    if (!payment) throw new NotFoundException(`Payment with id ${id} not found`);
    return new PaymentDto(payment);
  }

  async findByReference(reference: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { reference },
      relations: { subscriptions: true },
    });
  }

  async findByWompiTransactionId(wompiTransactionId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { wompiTransactionId },
      relations: { subscriptions: true },
    });
  }

  async create(data: {
    userId: string;
    reference: string;
    amountInCents: number;
    currency?: string;
  }): Promise<Payment> {
    const payment = this.paymentRepository.create({
      userId: data.userId,
      reference: data.reference,
      amountInCents: data.amountInCents,
      currency: data.currency || 'COP',
      status: 'pending',
    });

    return this.paymentRepository.save(payment);
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    additionalData?: {
      wompiTransactionId?: string;
      paymentMethod?: string;
      wompiResponse?: Record<string, any>;
      failureReason?: string;
      paidAt?: Date;
    },
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { subscriptions: true },
    });
    if (!payment) throw new NotFoundException(`Payment with id ${id} not found`);

    payment.status = status;
    if (additionalData) {
      if (additionalData.wompiTransactionId) payment.wompiTransactionId = additionalData.wompiTransactionId;
      if (additionalData.paymentMethod) payment.paymentMethod = additionalData.paymentMethod;
      if (additionalData.wompiResponse) payment.wompiResponse = additionalData.wompiResponse;
      if (additionalData.failureReason) payment.failureReason = additionalData.failureReason;
      if (additionalData.paidAt) payment.paidAt = additionalData.paidAt;
    }

    return this.paymentRepository.save(payment);
  }

  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BINNTU-PAY-${timestamp}-${random}`;
  }
}
