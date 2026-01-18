import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Plan } from './plan.entity';

@Entity({ name: 'plan_features' })
export class PlanFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Plan, plan => plan.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column('uuid', { name: 'plan_id' })
  planId: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('varchar', { length: 100, name: 'feature_key' })
  featureKey: string;

  @Column('varchar', { length: 255, name: 'feature_name' })
  featureName: string;

  @Column('jsonb', { nullable: true, name: 'feature_value' })
  featureValue: Record<string, any> | null;

  @Column('boolean', { default: true, name: 'is_enabled' })
  isEnabled: boolean;

  @Column('integer', { default: 0, name: 'sort_order' })
  sortOrder: number;
}
