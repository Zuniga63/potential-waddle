import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Town } from './town.entity';

@Entity({ name: 'town_info' })
export class TownInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @OneToOne(() => Town, town => town.info, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('date', { nullable: true })
  fundation?: Date;

  @Column('text', { nullable: true })
  history?: string;

  @Column('text', { nullable: true })
  culture?: string;

  @Column('text', { nullable: true })
  economic?: string;

  @Column('smallint', { nullable: true })
  altitude?: number;

  @Column('text', { name: 'postal_code', nullable: true })
  postalCode?: string;

  @Column('text', { name: 'calling_code', nullable: true })
  callingCode?: string;

  @Column('smallint', { nullable: true })
  temperature?: number;

  @Column('int', { nullable: true })
  population?: number;

  @Column('text', { name: 'distance_to_capital', nullable: true })
  distanceToCapital?: string;

  @Column('text', { nullable: true })
  ubication?: string;

  @Column('text', { name: 'official_name', nullable: true })
  officialName?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
