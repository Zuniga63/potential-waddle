import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentCategory } from '../enums';
import { TownDocumentRequirement } from './town-document-requirement.entity';
import { Document } from './document.entity';

@Entity({ name: 'document_type' })
export class DocumentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  category: DocumentCategory;

  @Column('boolean', { name: 'has_expiration', default: false })
  hasExpiration: boolean;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TownDocumentRequirement, (requirement) => requirement.documentType)
  townRequirements: TownDocumentRequirement[];

  @OneToMany(() => Document, (document) => document.documentType)
  documents: Document[];
}
