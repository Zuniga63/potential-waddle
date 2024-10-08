import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ImageResource } from 'src/modules/core/entities';
import { User } from 'src/modules/users/entities/user.entity';
import { Place } from 'src/modules/places/entities';
import { Lodging } from 'src/modules/lodgings/entities';
import { Experience } from 'src/modules/experiences/entities';

@Entity({ name: 'review' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => User, user => user.reviews, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Place, place => place.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  place?: Place | null;

  @ManyToOne(() => Lodging, lodging => lodging.reviews, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'lodging_id' })
  lodging?: Lodging | null;

  @ManyToOne(() => Experience, experience => experience.reviews, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'experience_id' })
  experience?: Experience | null;

  @ManyToMany(() => ImageResource, image => image.review, { onDelete: 'RESTRICT' })
  @JoinTable({ name: 'review_image' })
  images: ImageResource[];
  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint', { name: 'rating', default: 5 })
  rating: number;

  @Column('boolean', { name: 'is_public', default: false })
  isPublic: boolean;

  @Column('text', { default: '' })
  comment?: string;

  @Column('boolean', { default: false })
  approved: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
