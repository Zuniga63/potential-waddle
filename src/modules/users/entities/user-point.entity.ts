import { Place } from 'src/modules/places/entities';
import { Town } from 'src/modules/towns/entities';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Review } from 'src/modules/reviews/entities';

@Entity({ name: 'user_point' })
@Unique(['user', 'review', 'place', 'town'])
export class UserPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Review, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'review_id' })
  review?: Review;

  @ManyToOne(() => Place, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'place_id' })
  place?: Place;

  @ManyToOne(() => Town, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'town_id' })
  town?: Town;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint', { name: 'points_earned' })
  pointsEarned: number;

  @Column('smallint', { name: 'points_redeemed', default: 0 })
  pointsReedemed: number;

  @Column('integer', { name: 'distance_travelled', comment: 'Distance travelled in meters' })
  distanceTravelled: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;
}
