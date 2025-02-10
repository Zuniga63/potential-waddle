import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ImageResource } from 'src/modules/core/entities';
import { Guide } from './guide.entity';

@Entity({ name: 'guide_image' })
export class GuideImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Guide, guide => guide.images, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'guide_id' })
  guide: Guide;

  @ManyToOne(() => ImageResource, image => image.guides, { onDelete: 'RESTRICT' })
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
