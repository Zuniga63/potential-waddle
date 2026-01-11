import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DocumentEntityType, DocumentStatus } from '../enums';
import { DocumentType } from './document-type.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'document' })
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DocumentType, (documentType) => documentType.documents, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'document_type_id' })
  documentType: DocumentType;

  @Column('uuid', { name: 'document_type_id' })
  documentTypeId: string;

  @Column({
    type: 'enum',
    enum: DocumentEntityType,
    name: 'entity_type',
  })
  entityType: DocumentEntityType;

  @Column('uuid', { name: 'entity_id' })
  entityId: string;

  @Column('varchar', { length: 255, name: 'file_name' })
  fileName: string;

  @Column('text')
  url: string;

  @Column('text', { name: 'gcp_path' })
  gcpPath: string;

  @Column('varchar', { length: 100, name: 'mime_type' })
  mimeType: string;

  @Column('integer', { default: 0 })
  size: number;

  @Column('date', { name: 'expiration_date', nullable: true })
  expirationDate: Date | null;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column('text', { name: 'rejection_reason', nullable: true })
  rejectionReason: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column('uuid', { name: 'uploaded_by_id', nullable: true })
  uploadedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy: User;

  @Column('uuid', { name: 'reviewed_by_id', nullable: true })
  reviewedById: string;

  @Column('timestamp', { name: 'reviewed_at', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
