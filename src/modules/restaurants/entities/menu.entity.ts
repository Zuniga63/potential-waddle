import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity({ name: 'menu' })
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Restaurant, restaurant => restaurant.menus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('jsonb', { nullable: true })
  data: Record<string, any> | null;

  @Column('text', { name: 'file_url', nullable: true })
  fileUrl: string | null;

  @Column('text', { name: 'file_name', nullable: true })
  fileName: string | null;

  @Column('text', { name: 'mime_type', nullable: true })
  mimeType: string | null;

  @Column('text', { default: 'processing' })
  status: 'processing' | 'completed' | 'failed';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;
}
