import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ResourceProvider } from 'src/config';
import { ReviewImage } from 'src/modules/reviews/entities';
import { PlaceImage } from 'src/modules/places/entities';
import { LodgingImage } from 'src/modules/lodgings/entities';
import { ExperienceImage } from 'src/modules/experiences/entities';
import { RestaurantImage } from 'src/modules/restaurants/entities';

@Entity({ name: 'image_resource' })
export class ImageResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @OneToMany(() => PlaceImage, placeImage => placeImage.imageResource)
  placeImages: PlaceImage[];

  @OneToMany(() => LodgingImage, lodgingImage => lodgingImage.imageResource)
  lodgingImages: LodgingImage[];

  @OneToMany(() => ExperienceImage, experienceImage => experienceImage.imageResource)
  experienceImages: ExperienceImage[];

  @OneToMany(() => RestaurantImage, restaurantImage => restaurantImage.imageResource)
  restaurantImages?: RestaurantImage[];

  @OneToOne(() => ReviewImage, reviewImage => reviewImage.image, { cascade: true, onDelete: 'CASCADE' })
  reviewImage?: ReviewImage;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  url: string;

  @Column('text', { name: 'file_name', nullable: true })
  fileName: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { name: 'description_en', nullable: true })
  description_en?: string;

  @Column('text', { name: 'public_id', nullable: true })
  publicId?: string;

  @Column('integer', { nullable: true })
  width?: number;

  @Column('integer', { nullable: true })
  height?: number;

  @Column('text', { nullable: true })
  format?: string;

  @Column('text', { nullable: true, name: 'resource_type' })
  resourceType?: string;

  @Column('enum', { enum: ResourceProvider, nullable: true })
  provider?: ResourceProvider;

  // * ----------------------------------------------------------------------------------------------------------------
  // * DATES
  // * ----------------------------------------------------------------------------------------------------------------
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
