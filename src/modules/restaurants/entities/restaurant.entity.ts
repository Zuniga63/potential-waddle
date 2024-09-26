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
import { Place } from 'src/modules/places/entities';
import { Category, Facility } from 'src/modules/core/entities';
import { RestaurantImage } from './restaurant-image.entity';

@Entity({ name: 'restaurant' })
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Town, town => town.restaurants, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'town_id' })
  town?: Town;

  @ManyToOne(() => Place, place => place.restaurants, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'place_id' })
  place?: Place;

  @ManyToMany(() => Category, category => category.restaurants)
  @JoinTable({
    name: 'restaurant_category',
    joinColumn: { name: 'restaurant_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories?: Category[];

  @ManyToMany(() => Facility, facility => facility.restaurants)
  @JoinTable({
    name: 'restaurant_facility',
    joinColumn: { name: 'restaurant_id' },
    inverseJoinColumn: { name: 'facility_id' },
  })
  facilities?: Facility[];

  @OneToMany(() => RestaurantImage, image => image.restaurant)
  images?: RestaurantImage[];
  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  name: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('float', { default: 0 })
  rating: number;

  @Column('integer', { name: 'review_count', default: 0 })
  reviewCount: number;

  @Column('smallint', { default: 0 })
  points: number;

  @Column('text', { array: true, nullable: true, name: 'spoken_languages' })
  spokenLanguages: string[] | null;

  @Column('text', { nullable: true })
  address: string | null;

  @Column('text', { array: true, nullable: true, name: 'phone_numbers' })
  phoneNumbers: string[] | null;

  @Column('text', { name: 'whatsapp_numbers', array: true, default: '{}' })
  whatsappNumbers: string[] | null;

  @Column('text', { name: 'opening_hours', array: true, nullable: true })
  openingHours: string[] | null;

  @Column('text', { nullable: true })
  email: string | null;

  @Column('text', { nullable: true })
  website: string | null;

  @Column('text', { nullable: true })
  instagram: string | null;

  @Column('text', { nullable: true })
  facebook: string | null;

  @Column('decimal', { precision: 10, scale: 2, name: 'lowest_price', nullable: true })
  lowestPrice: number | null;

  @Column('decimal', { precision: 10, scale: 2, name: 'higher_price', nullable: true })
  higherPrice: number | null;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  location: Point;

  @Column('integer', { name: 'urban_center_distance', nullable: true })
  urbanCenterDistance: number;

  @Column('text', { name: 'google_maps_url', nullable: true })
  googleMapsUrl: string | null;

  @Column('text', { name: 'how_to_get_there', nullable: true })
  howToGetThere: string | null;

  @Column('text', { name: 'town_zone', nullable: true })
  townZone: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
