import { CategoryDto } from 'src/modules/core/dto';
import { TownDto } from 'src/modules/towns/dto';
import { Transport } from '../entities/transport.entity';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class TransportDto {
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the transport',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the transport',
  })
  firstName: string;
  lastName: string;
  documentType: string;
  document: string;
  phone: string;
  whatsapp?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  licensePlate?: string;
  createdAt?: Date;
  updatedAt?: Date;

  @ApiProperty({
    example: 4.5,
    description: 'Average rating of the transport',
  })
  rating?: number;

  @ApiProperty({
    example: 10,
    description: 'Number of reviews',
  })
  reviewCount?: number;

  @ApiProperty({
    example: true,
    description: 'Whether to show Binntu reviews',
  })
  showBinntuReviews?: boolean;

  // Relationships
  town?: TownDto;
  user?: UserDto;
  categories?: CategoryDto[];
  paymentMethods?: string[];
  isPublic?: boolean;
  forcedPublic?: boolean;
  userReview?: string;

  /**
   * Admin-only: true when the transport owner has accepted the active transport T&C document.
   * Undefined on public/non-admin endpoints.
   */
  @ApiProperty({
    example: true,
    description:
      'Admin-only: true when the transport owner has accepted the active transport T&C document. Undefined on public/non-admin endpoints.',
    readOnly: true,
    required: false,
  })
  ownerHasAcceptedTerms?: boolean;

  @ApiProperty({
    example: 'pending_review',
    description: 'Admin-only: current workflow status of the transport.',
    readOnly: true,
    required: false,
    enum: ['draft', 'pending_review', 'published', 'rejected'],
  })
  status?: 'draft' | 'pending_review' | 'published' | 'rejected';

  @ApiProperty({
    example: 'Missing license documents',
    description: 'Admin-only: reason provided when the transport was rejected. Null when not rejected.',
    readOnly: true,
    required: false,
    nullable: true,
  })
  rejectionReason?: string | null;

  constructor({ data, userReview }: { data: Transport; userReview?: string }) {
    if (!data) return;

    this.id = data.id;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.documentType = data.documentType;
    this.document = data.document;
    this.phone = data.phone;
    this.whatsapp = data.whatsapp;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.isAvailable = data.isAvailable;
    this.licensePlate = data.licensePlate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    // Map relationships
    this.town = data.town ? new TownDto(data.town) : undefined;
    this.user = data.user ? new UserDto(data.user) : undefined;
    this.categories = data.categories?.map(category => new CategoryDto(category));
    this.paymentMethods = data.paymentMethods || [];
    this.isPublic = data.isPublic;
    this.forcedPublic = data.forcedPublic;
    this.rating = data.rating ?? 0;
    this.reviewCount = data.reviewCount ?? 0;
    this.showBinntuReviews = data.showBinntuReviews ?? undefined;
    this.userReview = userReview;
    this.status = data.status;
    this.rejectionReason = data.rejectionReason ?? null;
  }
}
