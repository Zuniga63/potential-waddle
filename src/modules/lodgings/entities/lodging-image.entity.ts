import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Lodging } from './lodging.entity';
import { ImageResource } from 'src/modules/core/entities';

@Entity({ name: 'lodging_image' })
export class LodgingImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Lodging, lodging => lodging.images, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lodging_id' })
  lodging: Lodging;

  @ManyToOne(() => ImageResource, image => image.lodgingImages, { onDelete: 'RESTRICT' })
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
