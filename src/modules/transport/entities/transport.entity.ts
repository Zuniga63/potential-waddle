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
import { Town } from 'src/modules/towns/entities/town.entity';
import { Category } from 'src/modules/core/entities';
import { User } from 'src/modules/users/entities/user.entity';
import { Review } from 'src/modules/reviews/entities';

@Entity({ name: 'transport' })
export class Transport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------

  @ManyToOne(() => Town, town => town.transports, { nullable: false })
  @JoinColumn({ name: 'town_id' })
  town: Town;

  @OneToOne(() => User, user => user.transport, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => Category, category => category.transports)
  @JoinTable({
    name: 'transport_category',
    joinColumn: { name: 'transport_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories?: Category[];

  @OneToMany(() => Review, review => review.transport)
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

  @Column('text', { name: 'start_time', nullable: true })
  startTime: string;

  @Column('text', { name: 'end_time', nullable: true })
  endTime: string;

  @Column('boolean', { name: 'is_available', nullable: false, default: true })
  isAvailable: boolean;

  @Column('boolean', { name: 'is_public', nullable: true, default: true })
  isPublic: boolean;

  @Column('boolean', { name: 'show_binntu_reviews', default: true })
  showBinntuReviews: boolean;

  @Column('text', { name: 'license_plate', nullable: false })
  licensePlate: string;

  @Column('text', { name: 'payment_methods', array: true, nullable: true })
  paymentMethods: string[] | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
