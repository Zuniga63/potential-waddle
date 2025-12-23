import { Category, Facility } from 'src/modules/core/entities';
import { Town } from 'src/modules/towns/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Point,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExperienceImage } from './experience-image.entity';
import { Review } from 'src/modules/reviews/entities';
import { ExperienceGuide } from '../interfaces';
import { Guide } from 'src/modules/guides/entities/guide.entity';

@Entity({ name: 'experience' })
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Town, town => town.experiences, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @ManyToOne(() => Guide, guide => guide.experiences, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'guide_id' })
  guide: Guide;

  @ManyToMany(() => Facility, facility => facility.experiences)
  @JoinTable({
    name: 'experience_facility',
    joinColumn: { name: 'experience_id' },
    inverseJoinColumn: { name: 'facility_id' },
  })
  facilities: Facility[];

  @ManyToMany(() => Category, category => category.experiences)
  @JoinTable({
    name: 'experience_category',
    joinColumn: { name: 'experience_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories: Category[];

  @OneToMany(() => ExperienceImage, image => image.experience)
  @JoinTable({ name: 'experience_image' })
  images: ExperienceImage[];

  @OneToMany(() => Review, review => review.experience)
  reviews: Review[];
  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  title: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text')
  description: string;

  @Column('smallint', { name: 'difficulty_level', default: 1 })
  difficultyLevel: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('text', { name: 'departure_description', nullable: true })
  departureDescription: string | null;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326, name: 'departure_location', nullable: true })
  @Index({ spatial: true })
  departureLocation: Point;

  @Column('text', { name: 'arrival_description', nullable: true })
  arrivalDescription: string | null;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326, name: 'arrival_location', nullable: true })
  @Index({ spatial: true })
  arrivalLocation: Point;

  @Column('integer', { name: 'travel_time', nullable: true })
  travelTime: number | null;

  @Column('integer', { name: 'total_distance', nullable: true })
  totalDistance: number | null;

  @Column('float', { default: 0 })
  rating: number;

  @Column('smallint', { default: 0 })
  points: number;

  @Column('integer', { name: 'reviews_count', default: 0 })
  reviewsCount: number;

  @Column('smallint', { name: 'min_age', nullable: true })
  minAge: number | null;

  @Column('smallint', { name: 'max_age', nullable: true })
  maxAge: number | null;

  @Column('smallint', { nullable: true, name: 'min_participants' })
  minParticipants: number | null;

  @Column('smallint', { nullable: true, name: 'max_participants' })
  maxParticipants: number | null;

  @Column('text', { nullable: true })
  recommendations: string | null;

  @Column('text', { nullable: true, name: 'how_to_dress' })
  howToDress: string | null;

  @Column('text', { nullable: true })
  restrictions: string | null;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @Column('boolean', { name: 'show_binntu_reviews', default: true })
  showBinntuReviews: boolean;

  @Column('jsonb', { nullable: true, default: [] })
  guides: ExperienceGuide[];

  @Column('text', { name: 'payment_methods', array: true, nullable: true })
  paymentMethods: string[] | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
