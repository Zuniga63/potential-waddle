import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Badge } from './badge.entity';

@Entity({ name: 'entity_badge' })
@Index(['entityType', 'entityId'])
export class EntityBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_type' })
  entityType: 'lodging' | 'restaurant' | 'commerce' | 'guide' | 'transport';

  @ManyToOne(() => Badge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;

  @Column({ name: 'badge_id' })
  badgeId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
