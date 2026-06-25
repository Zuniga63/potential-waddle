import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'google_review_sync_log' })
@Index(['entityType', 'entityId', 'startedAt'])
export class GoogleReviewSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: 'lodging' | 'restaurant' | 'commerce';

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'trigger', type: 'varchar', length: 20 })
  trigger: 'cron' | 'manual';

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'running' })
  status: 'running' | 'success' | 'error';

  @Column({ name: 'started_at', type: 'timestamptz', default: () => 'NOW()' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'reviews_new', type: 'integer', nullable: true })
  reviewsNew: number | null;

  @Column({ name: 'reviews_total', type: 'integer', nullable: true })
  reviewsTotal: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
