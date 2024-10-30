import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReviewStatusEnum } from '../enums';
import { Review } from './review.entity';
import { User } from 'src/modules/users/entities';

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

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('enum', { enum: ReviewStatusEnum })
  status: ReviewStatusEnum;

  @Column('text', { nullable: true })
  reason: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
