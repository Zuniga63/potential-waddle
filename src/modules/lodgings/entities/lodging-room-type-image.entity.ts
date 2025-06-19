import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { LodgingRoomType } from './lodging-room-type.entity';
import { ImageResource } from 'src/modules/core/entities';

@Entity({ name: 'lodging_room_type_image' })
export class LodgingRoomTypeImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => LodgingRoomType, roomType => roomType.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_type_id' })
  roomType: LodgingRoomType;

  @ManyToOne(() => ImageResource, image => image.roomTypeImages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'image_resource_id' })
  imageResource: ImageResource;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint')
  order: number;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
