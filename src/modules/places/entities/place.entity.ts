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
import { PlaceImage } from './place-image.entity';
import { Review } from 'src/modules/reviews/entities';

@Entity({ name: 'place' })
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Town, town => town.places, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @ManyToMany(() => Facility, facility => facility.places)
  @JoinTable({ name: 'place_facility' })
  facilities: Facility[];

  @ManyToMany(() => Category, category => category.places)
  @JoinTable({ name: 'place_category' })
  categories: Category[];

  @OneToMany(() => PlaceImage, image => image.place)
  @JoinTable({ name: 'place_image' })
  images: PlaceImage[];

  @OneToMany(() => Review, review => review.place)
  reviews: Review[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  name: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text')
  description: string;

  @Column('smallint', { name: 'difficulty_level', default: 1 })
  difficultyLevel: number;

  @Column('float', { default: 0 })
  rating: number;

  @Column('smallint', { default: 0 })
  points: number;

  @Column('integer', { name: 'review_count', default: 0 })
  reviewCount: number;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  location: Point;

  @Column('smallint', { name: 'urbar_center_distance', default: 0 })
  urbarCenterDistance: number;

  @Column('text', { name: 'google_maps_url', nullable: true })
  googleMapsUrl: string;

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { nullable: true })
  history?: string;

  @Column('smallint', { nullable: true })
  temperature: number;

  @Column('smallint', { name: 'max_depth', nullable: true })
  maxDepth?: number;

  @Column('smallint', { nullable: true })
  altitude?: number;

  @Column('smallint', { nullable: true })
  capacity?: number;

  @Column('smallint', { name: 'min_age', nullable: true })
  minAge?: number;

  @Column('smallint', { name: 'max_age', nullable: true })
  maxAge?: number;

  @Column('text', { name: 'how_to_get_there', nullable: true })
  howToGetThere?: string;

  @Column('text', { name: 'transport_reference', nullable: true })
  transportReference?: string;

  @Column('text', { name: 'local_transport_options', nullable: true })
  localTransportOptions?: string;

  @Column('text', { name: 'arrival_reference', nullable: true })
  arrivalReference?: string;

  @Column('text', { nullable: true })
  recommendations?: string;

  @Column('text', { name: 'how_to_dress', nullable: true })
  howToDress?: string;

  @Column('text', { name: 'restrictions', nullable: true })
  restrictions?: string;

  @Column('text', { name: 'observations', nullable: true })
  observations?: string;

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('boolean', { name: 'state_db', default: true })
  stateDB: boolean;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
