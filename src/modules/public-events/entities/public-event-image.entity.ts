import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PublicEvent } from './public-event.entity';
import { ImageResource } from 'src/modules/core/entities';

@Entity({ name: 'public_event_image' })
export class PublicEventImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PublicEvent, publicEvent => publicEvent.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'public_event_id' })
  publicEvent: PublicEvent;

  @OneToOne(() => ImageResource, { cascade: true, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'image_resource_id' })
  imageResource: ImageResource;

  @Column('integer', { name: 'display_order', default: 0 })
  displayOrder: number;

  @Column('boolean', { name: 'is_main', default: false })
  isMain: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;
}