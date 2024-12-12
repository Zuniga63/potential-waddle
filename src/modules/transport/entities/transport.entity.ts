import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Town } from 'src/modules/towns/entities/town.entity';
import { Category } from 'src/modules/core/entities';
import { User } from 'src/modules/users/entities/user.entity';

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

  @OneToOne(() => User, user => user.transport, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => Category, category => category.transports)
  @JoinTable({
    name: 'transport_category',
    joinColumn: { name: 'transport_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories?: Category[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------

  @Column('text', { nullable: false })
  email: string;

  @Column('text', { nullable: false })
  firstName: string;

  @Column('text', { nullable: false })
  lastName: string;

  @Column('text', { nullable: false })
  documentType: string;

  @Column('text', { nullable: false })
  document: string;

  @Column('text', { nullable: false })
  phone: string;

  @Column('text', { nullable: true })
  whatsapp?: string;

  @Column('time', { name: 'start_time', nullable: false })
  startTime: string;

  @Column('time', { name: 'end_time', nullable: false })
  endTime: string;

  @Column('boolean', { nullable: false, default: true })
  isAvailable: boolean;

  @Column('text', { nullable: false })
  licensePlate: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
