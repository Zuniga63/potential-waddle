import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Lodging } from './lodging.entity';
import { Facility } from 'src/modules/core/entities';

@Entity({ name: 'lodging_facility' })
export class LodgingFacility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Lodging, lodging => lodging.facilities, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lodging_id' })
  lodging: Lodging;

  @ManyToOne(() => Facility, facility => facility.lodgings, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { nullable: true })
  operationHours: string | null;

  @Column('text', { nullable: true })
  locationDescription: string | null;

  @Column('text', { nullable: true })
  accesibliity: string | null;

  @Column('text', { nullable: true })
  additionalInfo: string | null;
}
