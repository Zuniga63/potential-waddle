import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity()
@Index(['entityType', 'entityId'])
export class GoogleReviewSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_type' })
  entityType: 'lodging' | 'restaurant' | 'commerce';

  @Column({ name: 'question' })
  question: string;

  @Column({ name: 'content' })
  content: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
