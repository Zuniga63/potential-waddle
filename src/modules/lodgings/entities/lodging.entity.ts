import { Column, CreateDateColumn, Entity, Index, Point, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'lodging' })
export class Lodging {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  name: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('integer', { name: 'review_count', default: 0 })
  reviewCount: number;

  @Column('smallint', { default: 0 })
  points: number;

  @Column('smallint', { name: 'room_count', default: 0 })
  roomCount: number;

  @Column('smallint', { default: 0 })
  rating: number;

  @Column('decimal', { name: 'lowest_price', precision: 10, scale: 2, nullable: true })
  lowestPrice: number | null;

  @Column('decimal', { name: 'highest_price', precision: 10, scale: 2, nullable: true })
  highestPrice: number | null;

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { nullable: true })
  address: string | null;

  @Column('text', { nullable: true })
  phone: string | null;

  @Column('text', { nullable: true })
  email: string | null;

  @Column('text', { nullable: true })
  website: string | null;

  @Column('text', { name: 'opening_hours', nullable: true })
  openingHours: string | null;

  @Column('text', { name: 'language_spoken', nullable: true })
  languageSpoken: string | null;

  // * ----------------------------------------------------------------------------------------------------------------
  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  @Index({ spatial: true })
  location: Point;

  @Column('text', { name: 'google_maps_url', nullable: true })
  googleMapsUrl: string | null;

  @Column('text', { name: 'how_to_get_there', nullable: true })
  howToGetThere: string | null;

  @Column('text', { name: 'arrival_reference', nullable: true })
  arrivalReference: string | null;

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
