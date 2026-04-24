import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/modules/users/entities';
import { TermsTypeEnum, TermsFormatEnum } from '../interfaces';

@Entity({ name: 'terms_documents' })
@Index(['type'])
export class TermsDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TermsTypeEnum })
  type: TermsTypeEnum;

  @Column({ type: 'enum', enum: TermsFormatEnum })
  format: TermsFormatEnum;

  @Column('text', { nullable: true })
  content: string | null;

  @Column('text', { name: 'file_url', nullable: true })
  fileUrl: string | null;

  @Column('boolean', { name: 'is_active', default: false })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
