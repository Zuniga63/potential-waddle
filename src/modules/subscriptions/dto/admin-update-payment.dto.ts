import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';

import { PaymentStatus } from '../entities';

export class AdminUpdatePaymentDto {
  @ApiProperty({ example: 'approved', enum: ['pending', 'approved', 'declined', 'voided', 'error'] })
  @IsEnum(['pending', 'approved', 'declined', 'voided', 'error'])
  status: PaymentStatus;

  @ApiPropertyOptional({ example: 'CARD', description: 'Payment method' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Insufficient funds', description: 'Failure reason (for declined/error)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}
