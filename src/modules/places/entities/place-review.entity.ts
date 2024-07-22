import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Place } from './place.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CloudinaryImage } from 'src/modules/cloudinary/interfaces';

@Entity({ name: 'place_review' })
export class PlaceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Place, place => place.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @ManyToOne(() => User, user => user.placeRwviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint')
  rating: number;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @Column('text', { nullable: true })
  comment: string;

  @Column('jsonb', { nullable: true })
  images: CloudinaryImage[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
