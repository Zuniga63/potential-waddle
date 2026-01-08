import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { RafaConversation } from './rafa-conversation.entity';
import { RafaIntent } from '../dto/rafa-intent.enum';

export type MessageRole = 'user' | 'assistant' | 'system';

@Entity({ name: 'rafa_messages' })
export class RafaMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => RafaConversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: RafaConversation;

  @Column('uuid', { name: 'conversation_id' })
  conversationId: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('varchar', { length: 20 })
  role: MessageRole;

  @Column('text')
  content: string;

  @Column('varchar', { length: 50, nullable: true })
  intent?: RafaIntent;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  confidence?: number;

  @Column('jsonb', { nullable: true, name: 'extracted_data' })
  extractedData?: Record<string, unknown>;

  @Column('varchar', { length: 50, nullable: true, name: 'tool_used' })
  toolUsed?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
