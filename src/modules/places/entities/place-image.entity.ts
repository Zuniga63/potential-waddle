import { ImageResource } from 'src/modules/core/entities';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Place } from './place.entity';

@Entity({ name: 'place_image' })
export class PlaceImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Place, place => place.images, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @ManyToOne(() => ImageResource, image => image.placeImages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'image_resource_id' })
  image: ImageResource;

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
