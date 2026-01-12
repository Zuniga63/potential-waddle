import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { DocumentType } from './document-type.entity';
import { Category } from '../../core/entities/category.entity';

@Entity({ name: 'category_document_exclusion' })
@Unique(['category', 'documentType'])
export class CategoryDocumentExclusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => DocumentType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_type_id' })
  documentType: DocumentType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
