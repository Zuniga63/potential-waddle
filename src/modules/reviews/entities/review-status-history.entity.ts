import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReviewStatus } from '../enums';
import { Review } from './review.entity';

@Entity({ name: 'review_status_history' })
export class ReviewStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Review, review => review.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('enum', { enum: ReviewStatus })
  status: ReviewStatus;

  @Column('text', { nullable: true })
  reason: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
