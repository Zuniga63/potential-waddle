import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Town } from './town.entity';

@Entity({ name: 'department' })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Town, town => town.department, { cascade: true })
  towns: Town[];

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  capital?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
