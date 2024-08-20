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

import { Department } from './department.entity';
import { Place } from 'src/modules/places/entities';
import { TownInfo } from './town-info.entity';
import { TownFestivity } from './town-festivity.entity';

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

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  url?: string;

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
