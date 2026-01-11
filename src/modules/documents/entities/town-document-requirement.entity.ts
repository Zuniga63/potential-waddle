import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { DocumentEntityType } from '../enums';
import { DocumentType } from './document-type.entity';
import { Town } from '../../towns/entities/town.entity';

@Entity({ name: 'town_document_requirement' })
@Unique(['town', 'documentType', 'entityType'])
export class TownDocumentRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Town, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @Column('uuid', { name: 'town_id' })
  townId: string;

  @ManyToOne(() => DocumentType, (documentType) => documentType.townRequirements, {
    onDelete: 'CASCADE',
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

  @Column('boolean', { name: 'is_required', default: false })
  isRequired: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
