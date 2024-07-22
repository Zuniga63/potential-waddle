import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Place } from './place.entity';

@Entity({ name: 'place_info' })
export class PlaceInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @OneToOne(() => Place, place => place.info, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('smallint', { name: 'min_age', nullable: true })
  minAge?: number;

  @Column('smallint', { name: 'max_age', nullable: true })
  maxAge?: number;

  @Column('smallint', { nullable: true })
  capacity?: number;

  @Column('smallint', { nullable: true })
  max_depth?: number;

  @Column('integer', { name: 'total_distance' })
  totalDistance: number;

  @Column('text', { nullable: true })
  history?: string;

  @Column('text', { name: 'how_to_get_there', nullable: true })
  howToGetThere?: string;

  @Column('text', { name: 'ref_to_get_there', nullable: true })
  refToGetThere?: string;

  @Column('text', { name: 'how_to_get_around', nullable: true })
  howToGetAround?: string;

  @Column('text', { nullable: true })
  recomendations?: string;

  @Column('text', { name: 'how_to_dress', nullable: true })
  howToDress?: string;

  @Column('text', { nullable: true })
  restrictions?: string;

  @Column('text', { nullable: true })
  observations?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // * ----------------------------------------------------------------------------------------------------------------
  // * ENGLISH FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { name: 'history_en', nullable: true })
  history_en?: string;

  @Column('text', { name: 'how_to_get_there_en', nullable: true })
  howToGetThere_en?: string;

  @Column('text', { name: 'ref_to_get_there_en', nullable: true })
  refToGetThere_en?: string;

  @Column('text', { name: 'how_to_get_around_en', nullable: true })
  howToGetAround_en?: string;

  @Column('text', { name: 'recomendations_en', nullable: true })
  recomendations_en?: string;

  @Column('text', { name: 'how_to_dress_en', nullable: true })
  howToDress_en?: string;

  @Column('text', { name: 'restrictions_en', nullable: true })
  restrictions_en?: string;

  @Column('text', { name: 'observations_en', nullable: true })
  observations_en?: string;
}
