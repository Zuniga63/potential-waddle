import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectLodgingDto {
  @ApiProperty({
    description: 'Reason for rejecting the lodging (min 10 chars, max 1000 chars)',
    example: 'Missing required images and price information.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'reason must be at least 10 characters' })
  @MaxLength(1000)
  reason: string;
}
