import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Town } from './town.entity';

@Entity({ name: 'municipality' })
export class Municipality {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Town, town => town.municipality, { cascade: true })
  towns: Town[];

  @Column('text', { unique: true })
  name: string;

  @Column('text', { nullable: true })
  capital?: string;

  @Column('text', { name: 'calling_code', nullable: true })
  callingCode: string;

  @Column('text', { name: 'postal_code', nullable: true })
  postalCode?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt?: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;
}
