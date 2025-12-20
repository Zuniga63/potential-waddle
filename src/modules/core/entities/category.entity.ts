import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Model } from './model.entity';
import { AppIcon } from './app-icon.entity';
import { ImageResource } from './image-resource.entity';
import { Place } from 'src/modules/places/entities';
import { Lodging } from 'src/modules/lodgings/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Transport } from 'src/modules/transport/entities/transport.entity';
import { Commerce } from 'src/modules/commerce/entities';
import { Guide } from 'src/modules/guides/entities/guide.entity';

@Entity({ name: 'category' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToMany(() => Model, model => model.categories, { onDelete: 'CASCADE' })
  models: Model[];

  @ManyToOne(() => AppIcon, icon => icon.categories, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'icon_id' })
  icon?: AppIcon;

  @ManyToOne(() => ImageResource, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'image_resource_id' })
  imageResource?: ImageResource;

  @ManyToMany(() => Place, place => place.categories)
  places: Place[];

  @ManyToMany(() => Lodging, lodging => lodging.categories)
  lodgings: Lodging[];

  @ManyToMany(() => Experience, experience => experience.categories)
  experiences: Experience[];

  @ManyToMany(() => Restaurant, restaurant => restaurant.categories)
  restaurants?: Restaurant[];

  @ManyToMany(() => Transport, transport => transport.categories)
  transports?: Transport[];

  @ManyToMany(() => Commerce, commerce => commerce.categories)
  commerces: Commerce[];

  @ManyToMany(() => Guide, guide => guide.categories)
  guides: Guide[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  name: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('boolean', { name: 'is_enabled', default: false })
  isEnabled: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // * ----------------------------------------------------------------------------------------------------------------
  // * VIRTUAL FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  imageUrl?: string;

  @AfterLoad()
  setImageUrl() {
    this.imageUrl = this.imageResource?.url;
  }
}
