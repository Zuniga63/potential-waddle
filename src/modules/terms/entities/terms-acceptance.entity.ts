import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/modules/users/entities';
import { TermsDocument } from './terms-document.entity';
import { TermsContextEnum } from '../interfaces';

@Entity({ name: 'terms_acceptances' })
@Index(['userId', 'termsDocumentId'], { unique: true })
@Index(['userId'])
export class TermsAcceptance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => TermsDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'terms_document_id' })
  termsDocument: TermsDocument;

  @Column('uuid', { name: 'terms_document_id' })
  termsDocumentId: string;

  @CreateDateColumn({ name: 'accepted_at' })
  acceptedAt: Date;

  @Column('varchar', { name: 'ip_address', length: 64 })
  ipAddress: string;

  @Column('text', { name: 'user_agent', nullable: true })
  userAgent: string | null;

  @Column({ type: 'enum', enum: TermsContextEnum })
  context: TermsContextEnum;
}
