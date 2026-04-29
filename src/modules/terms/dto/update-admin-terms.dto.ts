import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { TermsFormatEnum } from '../interfaces';

/**
 * Body shape for `PATCH /admin/terms/:id` (markdown branch — JSON).
 * For PDF replace, the controller accepts multipart/form-data and reads
 * `file` directly from the request.
 */
export class UpdateAdminTermsDto {
  @ApiProperty({ enum: TermsFormatEnum, required: false })
  @IsOptional()
  @IsEnum(TermsFormatEnum)
  format?: TermsFormatEnum;

  @ApiProperty({ example: '# Updated terms', required: false })
  @IsOptional()
  @IsString()
  content?: string;
}
