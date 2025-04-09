import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Lodging } from './lodging.entity';
import { Place } from 'src/modules/places/entities';

@Entity({ name: 'lodging_place' })
export class LodgingPlace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Lodging, lodging => lodging.places, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lodging_id' })
  lodging: Lodging;

  @ManyToOne(() => Place, place => place.lodgings, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint')
  order: number;

  @Column('boolean', { default: true, name: 'is_public' })
  isPublic: boolean;

  @Column('float', { name: 'distance' })
  distance: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
