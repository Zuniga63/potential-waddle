import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Model } from './model.entity';
import { AppIcon } from './app-icon.entity';
import { Place } from 'src/modules/places/entities';
import { LodgingFacility } from 'src/modules/lodgings/entities/lodging-facility.entity';
import { Experience } from 'src/modules/experiences/entities';

@Entity({ name: 'facility' })
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToMany(() => Model, model => model.facilities, { onDelete: 'CASCADE' })
  models: Model[];

  @ManyToOne(() => AppIcon, icon => icon.facilities, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'icon_id' })
  icon?: AppIcon;

  @ManyToMany(() => Place, place => place.facilities)
  places: Place[];

  @OneToMany(() => LodgingFacility, lodging => lodging.facility, { onDelete: 'RESTRICT' })
  lodgings: LodgingFacility[];

  @OneToMany(() => Experience, experience => experience.facilities)
  experiences: Experience[];
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
