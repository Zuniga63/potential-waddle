import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';
import { RafaMessage } from './rafa-message.entity';
import { RafaLead } from './rafa-lead.entity';
import { TripState } from '../dto/trip-state.dto';

@Entity({ name: 'rafa_conversations' })
export class RafaConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column('uuid', { nullable: true, name: 'user_id' })
  userId?: string;

  @OneToMany(() => RafaMessage, message => message.conversation)
  messages: RafaMessage[];

  @OneToMany(() => RafaLead, lead => lead.conversation)
  leads: RafaLead[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('jsonb', { default: {} })
  state: TripState;

  @Column('text', { nullable: true, name: 'session_id' })
  sessionId?: string;

  @Column('boolean', { default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
