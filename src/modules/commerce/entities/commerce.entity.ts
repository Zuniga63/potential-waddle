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

import { Town } from 'src/modules/towns/entities';
import { Category, Facility } from 'src/modules/core/entities';
import { CommerceImage } from './commerce-image.entity';
import { Review } from 'src/modules/reviews/entities';
import { User } from 'src/modules/users/entities';
@Entity({ name: 'commerce' })
export class Commerce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Town, town => town.commerces, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @ManyToMany(() => Category, category => category.commerces)
  @JoinTable({
    name: 'commerce_category',
    joinColumn: { name: 'commerce_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories: Category[];

  @OneToMany(() => CommerceImage, image => image.commerce)
  images: CommerceImage[];

  @ManyToMany(() => Facility, facility => facility.commerces)
  @JoinTable({
    name: 'commerce_facility',
    joinColumn: { name: 'commerce_id' },
    inverseJoinColumn: { name: 'facility_id' },
  })
  facilities: Facility[];

  @OneToMany(() => Review, review => review.commerce)
  reviews: Review[];

  @ManyToOne(() => User, user => user.commerces, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  name: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('smallint', { default: 0 })
  points: number;

  @Column('integer', { name: 'review_count', default: 0 })
  reviewCount: number;

  @Column('float', { default: 0 })
  rating: number;

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { nullable: true })
  address: string | null;

  @Column('text', { nullable: true, array: true, default: [], name: 'phone_numbers' })
  phoneNumbers: string[];

  @Column('text', { nullable: true })
  email: string | null;

  @Column('text', { nullable: true })
  website: string | null;

  @Column('text', { nullable: true })
  facebook: string | null;

  @Column('text', { nullable: true })
  instagram: string | null;

  @Column('text', { nullable: true, array: true, default: [], name: 'whatsapp_numbers' })
  whatsappNumbers: string[];

  @Column('text', { name: 'opening_hours', array: true, nullable: true })
  openingHours: string[] | null;

  @Column('text', { name: 'spoken_languages', nullable: true, array: true, default: [] })
  spokenLanguages: string[];

  @Column('text', { name: 'payment_methods', nullable: true, array: true, default: [] })
  paymentMethods: string[];

  @Column('text', { name: 'services', nullable: true, array: true, default: [] })
  services: string[];

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  location: Point;

  @Column('text', { name: 'google_maps_url', nullable: true })
  googleMapsUrl: string | null;

  @Column('smallint', { name: 'urban_center_distance', nullable: true })
  urbanCenterDistance: number | null;

  @Column('text', { name: 'how_to_get_there', nullable: true })
  howToGetThere: string | null;

  @Column('text', { name: 'arrival_reference', nullable: true })
  arrivalReference: string | null;

  @Column('float', { name: 'google_maps_rating', nullable: true })
  googleMapsRating: number | null;

  @Column('text', { name: 'google_maps_id', nullable: true })
  googleMapsId: string | null;

  @Column('integer', { name: 'google_maps_reviews_count', nullable: true })
  googleMapsReviewsCount: number | null;

  @Column('boolean', { name: 'show_google_maps_reviews', default: true })
  showGoogleMapsReviews: boolean;

  @Column('text', { name: 'google_maps_name', nullable: true })
  googleMapsName: string | null;

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @Column('boolean', { name: 'state_db', default: true })
  stateDB: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
