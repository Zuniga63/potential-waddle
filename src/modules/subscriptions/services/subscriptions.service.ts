import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { Subscription, Plan, Payment, EntityType } from '../entities';
import { SubscriptionDto, CreateCheckoutDto, CheckoutResponseDto } from '../dto';
import { PlansService } from './plans.service';
import { PaymentsService } from './payments.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * QUERIES
  // * ----------------------------------------------------------------------------------------------------------------

  async findAllByUser(userId: string): Promise<SubscriptionDto[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { userId },
      relations: { plan: { features: true } },
      order: { createdAt: 'DESC' },
    });

    return subscriptions.map(sub => new SubscriptionDto(sub));
  }

  async findOne(id: string): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: { plan: { features: true }, payment: true },
    });

    if (!subscription) throw new NotFoundException(`Subscription with id ${id} not found`);
    return new SubscriptionDto(subscription);
  }

  async findByEntity(entityType: EntityType, entityId: string): Promise<SubscriptionDto | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { entityType, entityId },
      relations: { plan: { features: true } },
      order: { createdAt: 'DESC' },
    });

    return subscription ? new SubscriptionDto(subscription) : null;
  }

  async getActiveSubscription(entityType: EntityType, entityId: string): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { entityType, entityId, status: 'active' },
      relations: { plan: { features: true } },
    });

    // Verificar si no ha expirado
    if (subscription && new Date() > subscription.currentPeriodEnd) {
      // Marcar como expirada
      subscription.status = 'expired';
      await this.subscriptionRepository.save(subscription);
      return null;
    }

    return subscription;
  }

  async hasActiveSubscription(entityType: EntityType, entityId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(entityType, entityId);
    return !!subscription;
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CHECKOUT - Crear pago pendiente con suscripciones
  // * ----------------------------------------------------------------------------------------------------------------

  async createCheckout(userId: string, dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    // 1. Validar que no existan suscripciones activas para los negocios seleccionados
    for (const item of dto.items) {
      const hasActive = await this.hasActiveSubscription(item.entityType, item.entityId);
      if (hasActive) {
        throw new BadRequestException(`El negocio "${item.entityName}" ya tiene una suscripción activa`);
      }
    }

    // 2. Obtener los planes y calcular el total
    const planIds = [...new Set(dto.items.map(item => item.planId))];
    const plans = await this.planRepository.find({ where: { id: In(planIds) } });
    const plansMap = new Map(plans.map(p => [p.id, p]));

    let totalAmountInCents = 0;
    const itemsDetail: CheckoutResponseDto['items'] = [];

    for (const item of dto.items) {
      const plan = plansMap.get(item.planId);
      if (!plan) throw new NotFoundException(`Plan con id ${item.planId} no encontrado`);

      totalAmountInCents += plan.priceInCents;
      itemsDetail.push({
        entityName: item.entityName,
        planName: plan.name,
        priceInCents: plan.priceInCents,
        price: Math.round(plan.priceInCents / 100),
      });
    }

    // 3. Generar referencia única
    const reference = this.paymentsService.generateReference();

    // 4. Crear el Payment pendiente
    const payment = await this.paymentsService.create({
      userId,
      reference,
      amountInCents: totalAmountInCents,
    });

    // 5. Crear las Subscriptions pendientes vinculadas al payment
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 mes por defecto

    for (const item of dto.items) {
      const plan = plansMap.get(item.planId)!;

      // Calcular fecha de fin según el billing interval del plan
      const subscriptionEnd = new Date(now);
      if (plan.billingInterval === 'yearly') {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      } else {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      }

      const subscription = this.subscriptionRepository.create({
        userId,
        planId: item.planId,
        paymentId: payment.id,
        status: 'pending',
        entityType: item.entityType,
        entityId: item.entityId,
        entityName: item.entityName,
        currentPeriodStart: now,
        currentPeriodEnd: subscriptionEnd,
      });

      await this.subscriptionRepository.save(subscription);
    }

    // 6. Generar firma de integridad para el widget de Wompi
    const integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET');
    const signature = crypto
      .createHash('sha256')
      .update(`${reference}${totalAmountInCents}COP${integritySecret}`)
      .digest('hex');

    // 7. Generar URL de redirección
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/profile/suscripciones?payment=${payment.id}`;

    return {
      paymentId: payment.id,
      reference,
      amountInCents: totalAmountInCents,
      amount: Math.round(totalAmountInCents / 100),
      currency: 'COP',
      publicKey: this.configService.get<string>('WOMPI_PUBLIC_KEY') || '',
      signature,
      redirectUrl,
      items: itemsDetail,
    };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ACTIVAR SUSCRIPCIONES - Llamado cuando el pago es aprobado
  // * ----------------------------------------------------------------------------------------------------------------

  async activateSubscriptionsByPayment(paymentId: string): Promise<void> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { paymentId },
    });

    const now = new Date();
    for (const subscription of subscriptions) {
      subscription.status = 'active';
      subscription.currentPeriodStart = now;

      // Recalcular fecha de fin
      const plan = await this.planRepository.findOne({ where: { id: subscription.planId } });
      if (plan) {
        const periodEnd = new Date(now);
        if (plan.billingInterval === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        subscription.currentPeriodEnd = periodEnd;
      }

      await this.subscriptionRepository.save(subscription);
    }
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * MARCAR COMO FALLIDAS - Llamado cuando el pago falla
  // * ----------------------------------------------------------------------------------------------------------------

  async failSubscriptionsByPayment(paymentId: string): Promise<void> {
    await this.subscriptionRepository.update({ paymentId }, { status: 'past_due' });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CANCELAR
  // * ----------------------------------------------------------------------------------------------------------------

  async cancel(id: string, userId: string): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, userId },
      relations: { plan: true },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status === 'canceled') {
      throw new BadRequestException('La suscripción ya está cancelada');
    }

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();

    await this.subscriptionRepository.save(subscription);
    return new SubscriptionDto(subscription);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN - LISTAR TODAS LAS SUSCRIPCIONES
  // * ----------------------------------------------------------------------------------------------------------------

  async findAllAdmin(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    entityType?: EntityType;
    sortBy?: 'createdAt' | 'updatedAt' | 'currentPeriodEnd';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ data: SubscriptionDto[]; count: number; pages: number; currentPage: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    const where: any = {};

    if (filters.search) {
      where.entityName = ILike(`%${filters.search}%`);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    const [subscriptions, count] = await this.subscriptionRepository.findAndCount({
      where,
      relations: { plan: { features: true }, user: true },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: subscriptions.map(sub => new SubscriptionDto(sub)),
      count,
      pages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN - CANCELAR SUSCRIPCIÓN (sin verificar userId)
  // * ----------------------------------------------------------------------------------------------------------------

  async adminCancel(id: string): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: { plan: true },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status === 'canceled') {
      throw new BadRequestException('La suscripción ya está cancelada');
    }

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();

    await this.subscriptionRepository.save(subscription);
    return new SubscriptionDto(subscription);
  }
}
