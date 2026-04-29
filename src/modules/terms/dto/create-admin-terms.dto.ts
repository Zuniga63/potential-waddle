import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

import { TermsFormatEnum, TermsTypeEnum } from '../interfaces';

/**
 * Body shape for `POST /admin/terms` (markdown branch — JSON).
 * The PDF branch is multipart/form-data; the controller validates that branch
 * directly against `Express.Multer.File` and the form fields, since
 * class-validator + multer combined have edge cases with file types.
 */
export class CreateAdminTermsDto {
  @ApiProperty({ enum: TermsTypeEnum, example: TermsTypeEnum.User })
  @IsEnum(TermsTypeEnum)
  type: TermsTypeEnum;

  @ApiProperty({ enum: TermsFormatEnum, example: TermsFormatEnum.Markdown })
  @IsEnum(TermsFormatEnum)
  format: TermsFormatEnum;

  @ApiProperty({
    example: '# Terms\n\nLorem ipsum...',
    required: false,
    description: 'Required when format=markdown. Ignored when format=pdf (file is sent in multipart).',
  })
  @ValidateIf((dto: CreateAdminTermsDto) => dto.format === TermsFormatEnum.Markdown)
  @IsString()
  @MinLength(1, { message: 'content is required when format=markdown' })
  @IsOptional()
  content?: string;
}
