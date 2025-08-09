import { Town } from 'src/modules/towns/entities';
import { User } from 'src/modules/users/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PublicEventImage } from './public-event-image.entity';

@Entity({ name: 'public_event' })
export class PublicEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Town, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PublicEventImage, image => image.publicEvent)
  images: PublicEventImage[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { name: 'event_name' })
  eventName: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  video: string;

  @Column('date', { name: 'start_date' })
  startDate: Date;

  @Column('time', { name: 'start_time' })
  startTime: string;

  @Column('date', { name: 'end_date', nullable: true })
  endDate: Date;

  @Column('time', { name: 'end_time', nullable: true })
  endTime: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column('text')
  address: string;

  @Column('text', { name: 'google_maps_url', nullable: true })
  googleMapsUrl: string;

  @Column('text')
  responsible: string;

  @Column('text')
  contact: string;

  @Column('text', { name: 'registration_link', nullable: true })
  registrationLink: string;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}