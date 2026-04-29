import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { TermsFormatEnum, TermsTypeEnum } from '../interfaces';

/**
 * Body shape for `PATCH /admin/terms/:id` (markdown branch — JSON).
 * For PDF replace, the controller accepts multipart/form-data and reads
 * `file` directly from the request.
 *
 * Note: `type` is accepted (the frontend echoes it back on edits) but the
 * service IGNORES it. The document's type is fixed at creation — changing it
 * post-create would violate the unique active-per-type constraint.
 */
export class UpdateAdminTermsDto {
  @ApiProperty({
    enum: TermsTypeEnum,
    required: false,
    description: 'Echoed by the frontend on edits — ignored server-side. Type is immutable post-create.',
  })
  @IsOptional()
  @IsEnum(TermsTypeEnum)
  type?: TermsTypeEnum;

  @ApiProperty({ enum: TermsFormatEnum, required: false })
  @IsOptional()
  @IsEnum(TermsFormatEnum)
  format?: TermsFormatEnum;

  @ApiProperty({ example: '# Updated terms', required: false })
  @IsOptional()
  @IsString()
  content?: string;
}
