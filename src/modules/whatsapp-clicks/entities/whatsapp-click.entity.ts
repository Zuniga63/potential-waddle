import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities';

@Entity({ name: 'whatsapp_click' })
@Index(['entityType', 'entityId'])
@Index(['sessionId'])
@Index(['clickedAt'])
export class WhatsappClick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * ENTITY INFORMATION
  // * ----------------------------------------------------------------------------------------------------------------
  @Column({ name: 'entity_id', type: 'text' })
  entityId: string;

  @Column({ name: 'entity_type', type: 'text' })
  entityType: 'lodging' | 'restaurant' | 'guide' | 'experience' | 'transport' | 'commerce' | 'place';

  @Column({ name: 'entity_slug', type: 'text', nullable: true })
  entitySlug: string | null;

  @Column({ name: 'phone_number', type: 'text' })
  phoneNumber: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * USER & SESSION
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'session_id', type: 'text', nullable: true })
  sessionId: string | null;

  // * ----------------------------------------------------------------------------------------------------------------
  // * REQUEST INFORMATION
  // * ----------------------------------------------------------------------------------------------------------------
  @Column({ name: 'ip_address', type: 'text', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  // * ----------------------------------------------------------------------------------------------------------------
  // * BROWSER & DEVICE INFO
  // * ----------------------------------------------------------------------------------------------------------------
  @Column({ name: 'browser_name', type: 'text', nullable: true })
  browserName: string | null;

  @Column({ name: 'browser_version', type: 'text', nullable: true })
  browserVersion: string | null;

  @Column({ name: 'os_name', type: 'text', nullable: true })
  osName: string | null;

  @Column({ name: 'os_version', type: 'text', nullable: true })
  osVersion: string | null;

  @Column({ name: 'device_type', type: 'text', nullable: true })
  deviceType: string | null;

  // * ----------------------------------------------------------------------------------------------------------------
  // * GEOLOCATION
  // * ----------------------------------------------------------------------------------------------------------------
  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number | null;

  @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  @Column({ name: 'country', type: 'text', nullable: true })
  country: string | null;

  @Column({ name: 'city', type: 'text', nullable: true })
  city: string | null;

  // * ----------------------------------------------------------------------------------------------------------------
  // * ANALYTICS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column({ name: 'referrer', type: 'text', nullable: true })
  referrer: string | null;

  @Column({ name: 'time_on_page', type: 'integer', nullable: true })
  timeOnPage: number | null;

  @Column({ name: 'is_repeat_click', type: 'boolean', default: false })
  isRepeatClick: boolean;

  @Column({ name: 'page_type', type: 'text', nullable: true })
  pageType: string | null;

  // * ----------------------------------------------------------------------------------------------------------------
  // * TIMESTAMPS
  // * ----------------------------------------------------------------------------------------------------------------
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'clicked_at' })
  clickedAt: Date;
}
