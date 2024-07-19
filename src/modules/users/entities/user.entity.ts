import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Role } from 'src/modules/roles/entities/role.entity';
import { CloudinaryImage } from 'src/modules/cloudinary/interfaces';
import { Session } from 'src/modules/auth/entities';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  username: string;

  @ManyToOne(() => Role, role => role.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column('text', { unique: true })
  email: string;

  @Column('text', { select: false, nullable: true })
  password: string;

  @Column('json', { nullable: true, name: 'profile_photo' })
  profilePhoto?: CloudinaryImage;

  @Column('timestamp', { nullable: true, name: 'email_verified_at' })
  emailVerifiedAt?: Date;

  @Column('boolean', { default: false, name: 'is_super_user' })
  isSuperUser?: boolean;

  @Column('boolean', { default: true, name: 'is_active' })
  isActive?: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @OneToMany(() => Session, session => session.user)
  sessions: Session[];

  @BeforeInsert()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }

  @BeforeUpdate()
  emailToLowerCaseOnUpdate() {
    this.email = this.email.toLowerCase();
  }
}
