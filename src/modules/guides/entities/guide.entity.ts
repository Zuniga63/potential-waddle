import { Category } from 'src/modules/core/entities';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GuideImage } from './guide-image.entity';
import { Experience } from 'src/modules/experiences/entities/experience.entity';

@Entity({ name: 'guide' })
export class Guide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------

  @OneToOne(() => User, user => user.guide, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => Category, category => category.guides)
  @JoinTable({
    name: 'guide_category',
    joinColumn: { name: 'guide_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories?: Category[];

  @OneToMany(() => GuideImage, image => image.guide)
  images?: GuideImage[];

  @OneToMany(() => Experience, experience => experience.guide)
  experiences?: Experience[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------

  @Column('text', { unique: true })
  slug: string;

  @Column('text', { name: 'email', nullable: false })
  email: string;

  @Column('text', { name: 'first_name', nullable: false })
  firstName: string;

  @Column('text', { name: 'last_name', nullable: false })
  lastName: string;

  @Column('text', { name: 'document_type', nullable: false })
  documentType: string;

  @Column('text', { name: 'document', nullable: false })
  document: string;

  @Column('text', { name: 'phone', nullable: false })
  phone: string;

  @Column('text', { name: 'whatsapp', nullable: false })
  whatsapp?: string;

  @Column('text', { name: 'address', nullable: false })
  address: string;

  @Column('text', { name: 'biography', nullable: true })
  biography?: string;

  @Column('text', { name: 'languages', nullable: true })
  languages?: string;

  @Column('text', { name: 'facebook', nullable: true })
  facebook?: string;

  @Column('text', { name: 'instagram', nullable: true })
  instagram?: string;

  @Column('text', { name: 'youtube', nullable: true })
  youtube?: string;

  @Column('text', { name: 'tiktok', nullable: true })
  tiktok?: string;

  @Column('boolean', { name: 'is_available', nullable: false, default: true })
  isAvailable: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
