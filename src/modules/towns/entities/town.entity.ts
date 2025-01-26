import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Point,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TownInfo } from './town-info.entity';
import { Department } from './department.entity';
import { Place } from 'src/modules/places/entities';
import { TownFestivity } from './town-festivity.entity';
import { Lodging } from 'src/modules/lodgings/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Transport } from 'src/modules/transport/entities/transport.entity';
import { Commerce } from 'src/modules/commerce/entities';

@Entity({ name: 'town' })
export class Town {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------

  @OneToOne(() => TownInfo, townInfo => townInfo.town, { nullable: true })
  info?: TownInfo;

  @OneToOne(() => TownFestivity, townFestivity => townFestivity.town, { nullable: true })
  festivity?: TownFestivity;

  @ManyToOne(() => Department, department => department.towns, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @OneToMany(() => Place, place => place.town)
  places: Place[];

  @OneToMany(() => Lodging, lodging => lodging.town)
  lodgings: Lodging[];

  @OneToMany(() => Experience, experience => experience.town)
  experiences: Experience[];

  @OneToMany(() => Restaurant, restaurant => restaurant.town)
  restaurants?: Restaurant[];

  @OneToMany(() => Transport, transport => transport.town)
  transports?: Transport[];

  @OneToMany(() => Commerce, commerce => commerce.town)
  commerces?: Commerce[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true, unique: true })
  code: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('float', { name: 'urban_area', default: 0 })
  urbanArea: number;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326, nullable: true })
  @Index({ spatial: true })
  location?: Point;

  @Column('boolean', { nullable: false, default: false, name: 'is_enable' })
  isEnable: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
