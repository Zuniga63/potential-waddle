import { ApiProperty } from '@nestjs/swagger';

import { TermsDocument } from '../entities';
import { TermsTypeEnum, TermsFormatEnum } from '../interfaces';

export class TermsDocumentDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ enum: TermsTypeEnum, example: TermsTypeEnum.User })
  type: TermsTypeEnum;

  @ApiProperty({ enum: TermsFormatEnum, example: TermsFormatEnum.Markdown })
  format: TermsFormatEnum;

  @ApiProperty({ example: '# Terms...', nullable: true, required: false })
  content: string | null;

  @ApiProperty({ example: null, nullable: true, required: false })
  fileUrl: string | null;

  @ApiProperty({ example: '2026-04-24T00:00:00.000Z' })
  updatedAt: string;

  constructor(doc?: TermsDocument) {
    if (!doc) return;
    this.id = doc.id;
    this.type = doc.type;
    this.format = doc.format;
    this.content = doc.content;
    this.fileUrl = doc.fileUrl;
    this.updatedAt = doc.updatedAt?.toISOString();
  }
}
