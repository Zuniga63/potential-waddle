import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Model } from './model.entity';

@Entity({ name: 'facility' })
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column('text', { name: 'name_en', nullable: true })
  name_en?: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('text', { name: 'slug_en', unique: true, nullable: true })
  slug_en?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { name: 'description_en', nullable: true })
  description_en?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToMany(() => Model, model => model.facilities, { onDelete: 'CASCADE' })
  models: Model[];
}
