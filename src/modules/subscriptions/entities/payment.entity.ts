import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/modules/users/entities';
import { Subscription } from './subscription.entity';

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'voided' | 'error';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @OneToMany(() => Subscription, subscription => subscription.payment)
  subscriptions: Subscription[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('integer', { name: 'amount_in_cents' })
  amountInCents: number;

  @Column('varchar', { length: 10, default: 'COP' })
  currency: string;

  @Column('varchar', { length: 20 })
  status: PaymentStatus;

  @Column('varchar', { length: 100, unique: true, name: 'reference' })
  reference: string; // BINNTU-PAY-uuid - referencia única para Wompi

  @Column('varchar', { length: 100, nullable: true, name: 'wompi_transaction_id' })
  wompiTransactionId: string | null;

  @Column('varchar', { length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: string | null; // CARD, PSE, NEQUI, BANCOLOMBIA, etc.

  @Column('jsonb', { nullable: true, name: 'wompi_response' })
  wompiResponse: Record<string, any> | null;

  @Column('text', { nullable: true, name: 'failure_reason' })
  failureReason: string | null;

  @Column('timestamp', { nullable: true, name: 'paid_at' })
  paidAt: Date | null;

  // * ----------------------------------------------------------------------------------------------------------------
  // * TIMESTAMPS
  // * ----------------------------------------------------------------------------------------------------------------
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column('timestamp', { name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
