import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Facility } from './facility.entity';

@Entity({ name: 'model' })
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToMany(() => Category, category => category.models, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'model_category' })
  categories: Category[];

  @ManyToMany(() => Facility, facility => facility.models, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'model_facility' })
  facilities: Facility[];
}
