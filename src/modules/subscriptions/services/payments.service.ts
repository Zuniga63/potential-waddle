import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

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

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN - LISTAR TODOS LOS PAGOS
  // * ----------------------------------------------------------------------------------------------------------------

  async findAllAdmin(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PaymentStatus;
    sortBy?: 'createdAt' | 'updatedAt' | 'amountInCents';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ data: PaymentDto[]; count: number; pages: number; currentPage: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    const where: any = {};

    if (filters.search) {
      where.reference = ILike(`%${filters.search}%`);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [payments, count] = await this.paymentRepository.findAndCount({
      where,
      relations: { subscriptions: { plan: true }, user: true },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: payments.map(payment => new PaymentDto(payment)),
      count,
      pages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN - ELIMINAR PAGO
  // * ----------------------------------------------------------------------------------------------------------------

  async deletePayment(id: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
    });

    if (!payment) throw new NotFoundException(`Payment with id ${id} not found`);

    await this.paymentRepository.remove(payment);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN - ACTUALIZAR ESTADO DE PAGO
  // * ----------------------------------------------------------------------------------------------------------------

  async adminUpdateStatus(
    id: string,
    status: PaymentStatus,
    additionalData?: {
      paymentMethod?: string;
      failureReason?: string;
    },
  ): Promise<PaymentDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { subscriptions: { plan: true } },
    });
    if (!payment) throw new NotFoundException(`Payment with id ${id} not found`);

    payment.status = status;
    if (status === 'approved' && !payment.paidAt) {
      payment.paidAt = new Date();
    }
    if (additionalData) {
      if (additionalData.paymentMethod) payment.paymentMethod = additionalData.paymentMethod;
      if (additionalData.failureReason) payment.failureReason = additionalData.failureReason;
    }

    await this.paymentRepository.save(payment);
    return new PaymentDto(payment);
  }
}
