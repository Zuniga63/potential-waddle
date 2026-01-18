import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Plan, PlanFeature } from '../entities';
import { PlanDto, CreatePlanDto, UpdatePlanDto } from '../dto';
import { CreatePlanFeatureDto, UpdatePlanFeatureDto } from '../dto/create-plan-feature.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(PlanFeature)
    private readonly featureRepository: Repository<PlanFeature>,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * PUBLIC QUERIES
  // * ----------------------------------------------------------------------------------------------------------------

  async findAll(): Promise<PlanDto[]> {
    const plans = await this.planRepository.find({
      where: { isActive: true },
      relations: { features: true },
      order: { sortOrder: 'ASC', features: { sortOrder: 'ASC' } },
    });

    return plans.map(plan => new PlanDto(plan));
  }

  async findOne(id: string): Promise<PlanDto> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: { features: true },
      order: { features: { sortOrder: 'ASC' } },
    });

    if (!plan) throw new NotFoundException(`Plan with id ${id} not found`);
    return new PlanDto(plan);
  }

  async findBySlug(slug: string): Promise<PlanDto> {
    const plan = await this.planRepository.findOne({
      where: { slug },
      relations: { features: true },
      order: { features: { sortOrder: 'ASC' } },
    });

    if (!plan) throw new NotFoundException(`Plan with slug ${slug} not found`);
    return new PlanDto(plan);
  }

  async findEntityById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan with id ${id} not found`);
    return plan;
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN QUERIES
  // * ----------------------------------------------------------------------------------------------------------------

  async findAllAdmin(): Promise<PlanDto[]> {
    const plans = await this.planRepository.find({
      relations: { features: true },
      order: { sortOrder: 'ASC', features: { sortOrder: 'ASC' } },
    });

    return plans.map(plan => new PlanDto(plan));
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN CRUD - PLANS
  // * ----------------------------------------------------------------------------------------------------------------

  async create(dto: CreatePlanDto): Promise<PlanDto> {
    // Check if slug already exists
    const existing = await this.planRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException(`Plan with slug "${dto.slug}" already exists`);
    }

    const billingInterval = (dto.billingInterval || 'monthly') as 'monthly' | 'yearly';

    const plan = this.planRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      priceInCents: dto.priceInCents,
      currency: dto.currency || 'COP',
      billingInterval,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    const savedPlan = await this.planRepository.save(plan) as Plan;

    // Create features if provided
    if (dto.features?.length) {
      for (const featureDto of dto.features) {
        const feature = this.featureRepository.create({
          planId: savedPlan.id,
          featureKey: featureDto.featureKey,
          featureName: featureDto.featureName,
          featureValue: featureDto.featureValue,
          isEnabled: featureDto.isEnabled,
          sortOrder: featureDto.sortOrder ?? 0,
        });
        await this.featureRepository.save(feature);
      }
    }

    return this.findOne(savedPlan.id);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanDto> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan with id ${id} not found`);

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== plan.slug) {
      const existing = await this.planRepository.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Plan with slug "${dto.slug}" already exists`);
      }
    }

    // Update plan fields
    Object.assign(plan, {
      ...(dto.name && { name: dto.name }),
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.priceInCents !== undefined && { priceInCents: dto.priceInCents }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.billingInterval && { billingInterval: dto.billingInterval as 'monthly' | 'yearly' }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });

    await this.planRepository.save(plan);

    // Update features if provided
    if (dto.features) {
      // Delete existing features and create new ones
      await this.featureRepository.delete({ planId: id });

      for (const featureDto of dto.features) {
        const feature = this.featureRepository.create({
          planId: id,
          featureKey: featureDto.featureKey,
          featureName: featureDto.featureName,
          featureValue: featureDto.featureValue,
          isEnabled: featureDto.isEnabled,
          sortOrder: featureDto.sortOrder ?? 0,
        });
        await this.featureRepository.save(feature);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan with id ${id} not found`);

    await this.planRepository.remove(plan);
  }

  async toggleActive(id: string): Promise<PlanDto> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan with id ${id} not found`);

    plan.isActive = !plan.isActive;
    await this.planRepository.save(plan);

    return this.findOne(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ADMIN CRUD - FEATURES
  // * ----------------------------------------------------------------------------------------------------------------

  async createFeature(dto: CreatePlanFeatureDto): Promise<PlanFeature> {
    const plan = await this.planRepository.findOne({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException(`Plan with id ${dto.planId} not found`);

    const feature = this.featureRepository.create({
      planId: dto.planId,
      featureKey: dto.featureKey,
      featureName: dto.featureName,
      featureValue: dto.featureValue,
      isEnabled: dto.isEnabled,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.featureRepository.save(feature);
  }

  async updateFeature(id: string, dto: UpdatePlanFeatureDto): Promise<PlanFeature> {
    const feature = await this.featureRepository.findOne({ where: { id } });
    if (!feature) throw new NotFoundException(`Feature with id ${id} not found`);

    Object.assign(feature, {
      ...(dto.featureKey && { featureKey: dto.featureKey }),
      ...(dto.featureName && { featureName: dto.featureName }),
      ...(dto.featureValue !== undefined && { featureValue: dto.featureValue }),
      ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });

    return this.featureRepository.save(feature);
  }

  async removeFeature(id: string): Promise<void> {
    const feature = await this.featureRepository.findOne({ where: { id } });
    if (!feature) throw new NotFoundException(`Feature with id ${id} not found`);

    await this.featureRepository.remove(feature);
  }
}
