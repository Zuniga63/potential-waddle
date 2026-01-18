import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PlanFeature } from './plan-feature.entity';
import { Subscription } from './subscription.entity';

@Entity({ name: 'plans' })
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @OneToMany(() => PlanFeature, feature => feature.plan)
  features: PlanFeature[];

  @OneToMany(() => Subscription, subscription => subscription.plan)
  subscriptions: Subscription[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('varchar', { length: 50 })
  name: string;

  @Column('varchar', { length: 50, unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('integer', { name: 'price_in_cents' })
  priceInCents: number;

  @Column('varchar', { length: 10, default: 'COP' })
  currency: string;

  @Column('varchar', { length: 20, default: 'monthly', name: 'billing_interval' })
  billingInterval: 'monthly' | 'yearly';

  @Column('boolean', { default: true, name: 'is_active' })
  isActive: boolean;

  @Column('integer', { default: 0, name: 'sort_order' })
  sortOrder: number;

  // * ----------------------------------------------------------------------------------------------------------------
  // * TIMESTAMPS
  // * ----------------------------------------------------------------------------------------------------------------
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column('timestamp', { name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
