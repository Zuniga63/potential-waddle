import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Role } from 'src/modules/roles/entities/role.entity';
import { CloudinaryImage } from 'src/modules/cloudinary/interfaces';
import { Session } from 'src/modules/auth/entities';
import { Review } from 'src/modules/reviews/entities';
import { UserPoint } from './user-point.entity';
import { Transport } from 'src/modules/transport/entities/transport.entity';
import { Guide } from 'src/modules/guides/entities/guide.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Role, role => role.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];

  @OneToMany(() => Review, review => review.approvedBy)
  approvedReviews: Review[];

  @OneToMany(() => UserPoint, userPoint => userPoint.user)
  points?: UserPoint[];

  @OneToOne(() => Transport, transport => transport.user)
  transport?: Transport;

  @OneToOne(() => Guide, guide => guide.user)
  guide?: Guide;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('text')
  username: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text', { select: false, nullable: true })
  password?: string;

  hasPassword?: boolean;

  @Column('timestamp', { nullable: true, name: 'birth_date' })
  birthDate: Date | null;

  @Column('text', { nullable: true })
  country: string | null;

  @Column('text', { nullable: true, name: 'country_state' })
  countryState: string | null;

  @Column('text', { nullable: true })
  city: string | null;

  @Column('json', { nullable: true, name: 'profile_photo' })
  profilePhoto?: CloudinaryImage | null;

  @Column('timestamp', { nullable: true, name: 'email_verified_at' })
  emailVerifiedAt?: Date;

  @Column('boolean', { default: false, name: 'is_super_user' })
  isSuperUser?: boolean;

  @Column('boolean', { default: true, name: 'is_active' })
  isActive?: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column('timestamp', { name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Session, session => session.user)
  sessions?: Session[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * POINT SYSTEM
  // * ----------------------------------------------------------------------------------------------------------------

  @Column('int', { default: 0, name: 'total_points' })
  totalPoints: number;

  @Column('int', { default: 0, name: 'remaining_points' })
  remainingPoints: number;

  @Column('int', { default: 0, name: 'ranking_points' })
  rankingPoints: number;

  @Column('int', { default: 0, name: 'distance_travelled', comment: 'Distance travelled in meters' })
  distanceTravelled: number;

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  setHasPassword() {
    this.hasPassword = this.password ? true : false;
  }
}
