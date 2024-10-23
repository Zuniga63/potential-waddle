import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Place } from 'src/modules/places/entities';
import { Lodging } from 'src/modules/lodgings/entities';
import { Experience } from 'src/modules/experiences/entities';
import { ReviewStatus } from '../enums';
import { ReviewImage } from './review-image.entity';
import { ReviewStatusHistory } from './review-status-history.entity';

@Entity({ name: 'review' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => User, user => user.reviews, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Place, place => place.reviews, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'place_id' })
  place?: Place | null;

  @ManyToOne(() => Lodging, lodging => lodging.reviews, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'lodging_id' })
  lodging?: Lodging | null;

  @ManyToOne(() => Experience, experience => experience.reviews, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'experience_id' })
  experience?: Experience | null;

  @OneToMany(() => ReviewImage, image => image.review, { cascade: true, onDelete: 'CASCADE' })
  images: ReviewImage[];

  @ManyToOne(() => User, user => user.approvedReviews, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User;

  @OneToMany(() => ReviewStatusHistory, statusHistory => statusHistory.review, { cascade: true, onDelete: 'CASCADE' })
  statusHistory: ReviewStatusHistory[];
  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint', { name: 'rating', default: 5 })
  rating: number;

  @Column('boolean', { name: 'is_public', default: true })
  isPublic: boolean;

  @Column('text', { nullable: true })
  comment: string | null;

  @Column('enum', { enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column('timestamp', { name: 'approved_at', nullable: true })
  approvedAt: Date;
}
