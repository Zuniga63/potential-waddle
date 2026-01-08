import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { RafaConversation } from './rafa-conversation.entity';
import { TripState } from '../dto/trip-state.dto';

export type LeadStatus = 'pending' | 'contacted' | 'converted' | 'rejected';
export type LeadEntityType = 'lodging' | 'restaurant' | 'experience' | 'guide' | 'transport' | 'commerce';

@Entity({ name: 'rafa_leads' })
export class RafaLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => RafaConversation, conversation => conversation.leads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: RafaConversation;

  @Column('uuid', { name: 'conversation_id' })
  conversationId: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('varchar', { length: 50, name: 'entity_type' })
  entityType: LeadEntityType;

  @Column('uuid', { name: 'entity_id' })
  entityId: string;

  @Column('varchar', { length: 20, nullable: true, name: 'contact_phone' })
  contactPhone?: string;

  @Column('varchar', { length: 100, nullable: true, name: 'contact_email' })
  contactEmail?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('varchar', { length: 20, default: 'pending' })
  status: LeadStatus;

  @Column('jsonb', { nullable: true, name: 'state_snapshot' })
  stateSnapshot?: TripState;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
