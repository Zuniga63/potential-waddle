import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleReviewSummaryRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
