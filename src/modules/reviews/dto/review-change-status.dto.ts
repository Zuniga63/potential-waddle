import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatusEnum } from '../enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewChangeStatusDto {
  @ApiProperty({ enum: ReviewStatusEnum, required: true, description: 'This is the new status for the review.' })
  @IsEnum(ReviewStatusEnum)
  @IsNotEmpty()
  status: ReviewStatusEnum;

  @ApiPropertyOptional({
    type: String,
    description:
      'This optional property provides the reason for approving or rejecting the review, and it explains the status change.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
