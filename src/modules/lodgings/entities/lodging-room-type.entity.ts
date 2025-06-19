import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Lodging } from './lodging.entity';
import { LodgingRoomTypeImage } from './lodging-room-type-image.entity';

@Entity({ name: 'lodging_room_type' })
export class LodgingRoomType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Lodging, lodging => lodging.roomTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lodging_id' })
  lodging: Lodging;

  @OneToMany(() => LodgingRoomTypeImage, image => image.roomType)
  images: LodgingRoomTypeImage[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('integer', { name: 'max_capacity' })
  maxCapacity: number;

  @Column('integer', { name: 'bed_count', default: 1 })
  bedCount: number;

  @Column('text', { name: 'bed_type', nullable: true })
  bedType: string | null; // single, double, queen, king, etc.

  @Column('float', { name: 'room_size', nullable: true })
  roomSize: number | null; // in square meters

  @Column('boolean', { name: 'smoking_allowed', default: false })
  smokingAllowed: boolean;

  @Column('text', { array: true, default: [] })
  amenities: string[];

  @Column('integer', { name: 'room_count', default: 1 })
  roomCount: number; // how many rooms of this type are available

  @Column('text', { name: 'bathroom_type', nullable: true })
  bathroomType: string | null; // private, shared, etc.

  @Column('boolean', { name: 'has_balcony', default: false })
  hasBalcony: boolean;

  @Column('boolean', { name: 'has_kitchen', default: false })
  hasKitchen: boolean;

  @Column('boolean', { name: 'has_air_conditioning', default: false })
  hasAirConditioning: boolean;

  @Column('boolean', { name: 'has_wifi', default: true })
  hasWifi: boolean;

  @Column('text', { nullable: true })
  view: string | null; // sea view, mountain view, city view, etc.

  // * ----------------------------------------------------------------------------------------------------------------
  // * CONTROL FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
