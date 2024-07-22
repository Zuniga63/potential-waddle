import { Category, Facility } from 'src/modules/core/entities';
import { Town } from 'src/modules/towns/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlaceInfo } from './place-info.entity';
import { PlaceLocation } from './place-location.entity';
import { PlaceReview } from './place-review.entity';
import { CloudinaryImage } from 'src/modules/cloudinary/interfaces';
import { PlaceImage } from './place-image.entity';

@Entity({ name: 'place' })
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToMany(() => Town, town => town.place, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @OneToOne(() => PlaceInfo, { nullable: true, onDelete: 'SET NULL' })
  info?: PlaceInfo;

  @OneToOne(() => PlaceLocation, { nullable: true, onDelete: 'SET NULL' })
  location: PlaceLocation;

  @ManyToMany(() => Facility, facility => facility.places)
  @JoinTable({ name: 'place_facility' })
  facilities: Facility[];

  @ManyToMany(() => Category, category => category.places)
  @JoinTable({ name: 'place_category' })
  categories: Category[];

  @OneToMany(() => PlaceImage, image => image.place)
  @JoinTable({
    name: 'place_image',
    joinColumn: { name: 'place_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'image_id', referencedColumnName: 'id' },
  })
  images: PlaceImage[];

  @OneToMany(() => PlaceReview, review => review.place)
  reviews: PlaceReview[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  name: string;

  @Column('jsonb', { nullable: false })
  image: CloudinaryImage;

  @Column('text', { unique: true })
  slug: string;

  @Column('text')
  description: string;

  @Column('smallint', { name: 'difficulty_level', default: 1 })
  difficultyLevel: number;

  @Column('smallint', { default: 0 })
  rating: number;

  @Column('smallint', { default: 0 })
  points: number;

  @Column('integer', { name: 'review_count', default: 0 })
  reviewCount: number;

  @Column('boolean', { default: true })
  stateDB: boolean;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // * ----------------------------------------------------------------------------------------------------------------
  // * ENGLISH FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { nullable: true })
  name_en?: string;

  @Column('text', { unique: true, nullable: true })
  slug_en?: string;

  @Column('text', { nullable: true })
  description_en?: string;
}
