import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { calculateAge } from 'src/utils';

export class UserDto {
  @ApiProperty({ example: 'df5e7f56-ce51-4428-9d43-84e35a077618' })
  id: string;

  @ApiProperty({ example: 'Jhon Doe' })
  username: string;

  @ApiProperty({ example: 'jhondoe@email.com' })
  email: string;

  @ApiProperty({ example: null, nullable: true, required: false })
  profilePhoto?: string | null;

  @ApiProperty({ example: null, nullable: true })
  emailVerifiedAt?: string | null;

  @ApiProperty({ example: false })
  isSuperUser: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  hasPassword: boolean;

  @ApiProperty({ example: '1990-01-01' })
  birthDate?: string;

  @ApiProperty({ example: 30 })
  age?: number;

  @ApiProperty({ example: '2024-06-23T05:13:57.328Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-06-23T05:13:57.328Z' })
  updatedAt: string;

  constructor(user?: User) {
    if (!user) return;

    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.profilePhoto = user.profilePhoto?.url;
    this.emailVerifiedAt = user.emailVerifiedAt?.toISOString() || undefined;
    this.isSuperUser = user.isSuperUser || false;
    this.isActive = user.isActive || false;
    this.age = user.birthDate ? calculateAge(user.birthDate) : undefined;
    this.birthDate = user.birthDate?.toISOString() || undefined;
    this.hasPassword = user.hasPassword || false;
    this.createdAt = user.createdAt.toISOString();
    this.updatedAt = user.updatedAt.toISOString();
  }
}
