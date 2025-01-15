import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Model } from './model.entity';
import { AppIcon } from './app-icon.entity';
import { Place } from 'src/modules/places/entities';
import { Lodging } from 'src/modules/lodgings/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Transport } from 'src/modules/transport/entities/transport.entity';

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
}
