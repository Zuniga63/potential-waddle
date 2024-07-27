import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { CloudinaryImage } from 'src/modules/cloudinary/interfaces';
import { Municipality } from './municipality.entity';
import { Place } from 'src/modules/places/entities';

@Entity({ name: 'town' })
export class Town {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------

  @ManyToOne(() => Municipality, municipality => municipality.towns, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'municipality_id' })
  municipality?: Municipality;

  @OneToMany(() => Place, place => place.town)
  places: Place[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text', { unique: true, nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { name: 'description_en', nullable: true })
  description_en?: string;

  @Column('jsonb', { nullable: true })
  flag?: CloudinaryImage;

  @Column('jsonb', { nullable: true })
  shield?: CloudinaryImage;

  @Column('jsonb', { nullable: true })
  image?: CloudinaryImage;

  @Column('text', { name: 'postal_code', nullable: true })
  postalCode?: string;

  @Column('text', { nullable: true })
  url?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt?: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;
}
