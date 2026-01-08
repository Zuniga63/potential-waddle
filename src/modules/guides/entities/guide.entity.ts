import { Category } from 'src/modules/core/entities';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GuideImage } from './guide-image.entity';
import { Experience } from 'src/modules/experiences/entities/experience.entity';
import { Town } from 'src/modules/towns/entities/town.entity';
import { Review } from 'src/modules/reviews/entities';

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

  @ManyToMany(() => Town)
  @JoinTable({
    name: 'guide_town',
    joinColumn: { name: 'guide_id' },
    inverseJoinColumn: { name: 'town_id' },
  })
  towns?: Town[];

  @OneToMany(() => Review, review => review.guide)
  reviews?: Review[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------

  @Column('smallint', { default: 0 })
  points: number;

  @Column('float', { default: 0 })
  rating: number;

  @Column('integer', { name: 'review_count', default: 0 })
  reviewCount: number;

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

  @Column('text', { name: 'phone', nullable: true })
  phone: string;

  @Column('text', { name: 'whatsapp', nullable: true })
  whatsapp?: string;

  @Column('text', { name: 'address', nullable: true })
  address: string;

  @Column('text', { name: 'biography', nullable: true })
  biography?: string;

  @Column('text', { name: 'languages', nullable: true, array: true, default: [] })
  languages: string[];

  @Column('text', { name: 'guide_type', nullable: true, array: true, default: [] })
  guideType: string[];

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

  @Column('boolean', { name: 'is_public', nullable: false, default: false })
  isPublic: boolean;

  @Column('boolean', { name: 'show_binntu_reviews', default: true })
  showBinntuReviews: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
