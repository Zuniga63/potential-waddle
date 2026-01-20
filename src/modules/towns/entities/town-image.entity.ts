import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Town } from './town.entity';
import { ImageResource } from 'src/modules/core/entities';

@Entity({ name: 'town_image' })
export class TownImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Town, town => town.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @ManyToOne(() => ImageResource, image => image.townImages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'image_resource_id' })
  imageResource: ImageResource;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint', { default: 0 })
  order: number;

  @Column('boolean', { default: false, name: 'is_hero' })
  isHero: boolean;

  @Column('smallint', { nullable: true, name: 'hero_position' })
  heroPosition?: number;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
