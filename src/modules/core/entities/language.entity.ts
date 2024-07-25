import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'language' })
export class Language {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  name: string;

  @Column('text', { unique: true })
  code: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
