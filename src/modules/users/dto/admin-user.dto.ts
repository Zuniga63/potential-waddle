import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { calculateAge } from 'src/utils';

export class AdminUserDto {
  @ApiProperty({ example: 'df5e7f56-ce51-4428-9d43-84e35a077618' })
  id: string;

  @ApiProperty({ example: 'Jhon Doe' })
  username: string;

  @ApiProperty({ example: 'jhondoe@email.com' })
  email: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', nullable: true })
  profilePhoto?: string | null;

  @ApiProperty({ example: '2024-06-23T05:13:57.328Z', nullable: true })
  emailVerifiedAt?: string | null;

  @ApiProperty({ example: false })
  isSuperUser: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  hasPassword: boolean;

  @ApiProperty({ example: '1990-01-01', nullable: true })
  birthDate?: string | null;

  @ApiProperty({ example: 30, nullable: true })
  age?: number | null;

  @ApiProperty({ example: 'Colombia', nullable: true })
  country?: string | null;

  @ApiProperty({ example: 'Antioquia', nullable: true })
  countryState?: string | null;

  @ApiProperty({ example: 'Medellín', nullable: true })
  city?: string | null;

  @ApiProperty({ example: 100 })
  totalPoints: number;

  @ApiProperty({ example: 50 })
  remainingPoints: number;

  @ApiProperty({ example: 75 })
  rankingPoints: number;

  @ApiProperty({ example: 150 })
  distanceTravelled: number;

  @ApiProperty({ example: 5 })
  reviewsCount: number;

  @ApiProperty({ example: 2 })
  approvedReviewsCount: number;

  @ApiProperty({ example: '2024-06-23T05:13:57.328Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-06-23T05:13:57.328Z' })
  updatedAt: string;

  @ApiProperty({ example: 'user', nullable: true })
  roleName?: string | null;

  constructor(user: User) {
    const birthDate = user.birthDate ? new Date(user.birthDate) : null;

    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.profilePhoto = user.profilePhoto?.url || null;
    this.emailVerifiedAt = user.emailVerifiedAt?.toISOString() || null;
    this.isSuperUser = user.isSuperUser || false;
    this.isActive = user.isActive || false;
    this.hasPassword = user.hasPassword || false;
    this.birthDate = birthDate?.toISOString() || null;
    this.age = birthDate ? calculateAge(birthDate) : null;
    this.country = user.country || null;
    this.countryState = user.countryState || null;
    this.city = user.city || null;
    this.totalPoints = user.totalPoints || 0;
    this.remainingPoints = user.remainingPoints || 0;
    this.rankingPoints = user.rankingPoints || 0;
    this.distanceTravelled = user.distanceTravelled || 0;
    this.reviewsCount = user.reviews?.length || 0;
    this.approvedReviewsCount = user.reviews?.filter(r => r.status === 'approved').length || 0;
    this.createdAt = user.createdAt.toISOString();
    this.updatedAt = user.updatedAt.toISOString();
    this.roleName = user.role?.name || null;
  }
}
