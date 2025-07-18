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
import { LodgingImage } from './lodging-image.entity';
import { Review } from 'src/modules/reviews/entities';
import { User } from 'src/modules/users/entities';
import { LodgingPlace } from './lodging-place.entity';
import { LodgingRoomType } from './lodging-room-type.entity';

@Entity({ name: 'lodging' })
export class Lodging {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Town, town => town.lodgings, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @ManyToMany(() => Category, category => category.lodgings)
  @JoinTable({
    name: 'lodging_category',
    joinColumn: { name: 'lodging_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories: Category[];

  @OneToMany(() => LodgingImage, image => image.lodging)
  images: LodgingImage[];

  @ManyToMany(() => Facility, facility => facility.lodgings)
  @JoinTable({
    name: 'lodging_facility',
    joinColumn: { name: 'lodging_id' },
    inverseJoinColumn: { name: 'facility_id' },
  })
  facilities: Facility[];

  @ManyToOne(() => User, user => user.lodgings, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Review, review => review.lodging)
  reviews: Review[];

  @OneToMany(() => LodgingPlace, place => place.lodging)
  places: LodgingPlace[];

  @OneToMany(() => LodgingRoomType, roomType => roomType.lodging)
  lodgingRoomTypes: LodgingRoomType[];

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

  @Column('text', { name: 'room_types', array: true, default: [] })
  roomTypes: string[];

  @Column('text', { array: true, default: [] })
  amenities: string[];

  @Column('smallint', { name: 'room_count', default: 0 })
  roomCount: number;

  @Column('decimal', { name: 'lowest_price', precision: 10, scale: 2, nullable: true })
  lowestPrice: number | null;

  @Column('decimal', { name: 'highest_price', precision: 10, scale: 2, nullable: true })
  highestPrice: number | null;

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

  @Column('integer', { name: 'capacity', nullable: true })
  capacity: number | null;

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  location: Point;

  @Column('text', { name: 'google_maps_url', nullable: true })
  googleMapsUrl: string | null;

  @Column('integer', { name: 'urban_center_distance', nullable: true })
  urbanCenterDistance: number | null;

  @Column('text', { name: 'how_to_get_there', nullable: true })
  howToGetThere: string | null;

  @Column('text', { name: 'arrival_reference', nullable: true })
  arrivalReference: string | null;

  @Column('text', { name: 'payment_methods', array: true, nullable: true })
  paymentMethods: string[] | null;

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
