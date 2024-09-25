import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Experience } from './experience.entity';
import { ImageResource } from 'src/modules/core/entities';

@Entity({ name: 'experience_image' })
export class ExperienceImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Experience, experience => experience.images, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'experience_id' })
  experience: Experience;

  @ManyToOne(() => ImageResource, image => image.experienceImages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'image_resource_id' })
  imageResource: ImageResource;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint', { default: 0 })
  order: number;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
