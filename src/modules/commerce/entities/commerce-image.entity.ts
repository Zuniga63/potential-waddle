import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Commerce } from './commerce.entity';
import { ImageResource } from 'src/modules/core/entities';

@Entity({ name: 'commerce_image' })
export class CommerceImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Commerce, commerce => commerce.images, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'commerce_id' })
  commerce: Commerce;

  @ManyToOne(() => ImageResource, image => image.commerceImages, { onDelete: 'RESTRICT' })
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
