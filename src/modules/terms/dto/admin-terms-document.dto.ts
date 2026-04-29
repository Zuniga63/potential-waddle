import { ApiProperty } from '@nestjs/swagger';

import { TermsDocument } from '../entities';
import { TermsTypeEnum, TermsFormatEnum } from '../interfaces';

export class AdminTermsCreatedByDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ example: 'admin@example.com', required: false })
  name: string;

  @ApiProperty({ example: 'admin@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'admin', required: false })
  username?: string;

  constructor(data?: { id: string; name: string; email?: string; username?: string }) {
    if (!data) {
      this.id = '';
      this.name = 'Sistema';
      return;
    }
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.username = data.username;
  }
}

export class AdminTermsDocumentDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ enum: TermsTypeEnum })
  type: TermsTypeEnum;

  @ApiProperty({ enum: TermsFormatEnum })
  format: TermsFormatEnum;

  @ApiProperty({ example: '# Terms...', nullable: true, required: false })
  content: string | null;

  @ApiProperty({ example: 'https://...', nullable: true, required: false })
  fileUrl: string | null;

  @ApiProperty({ example: false })
  isActive: boolean;

  @ApiProperty({ type: AdminTermsCreatedByDto })
  createdBy: AdminTermsCreatedByDto;

  @ApiProperty({ example: '2026-04-24T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-04-24T00:00:00.000Z' })
  updatedAt: string;

  @ApiProperty({ example: 0, description: 'Number of acceptance rows pointing at this document' })
  acceptanceCount: number;

  constructor(doc: TermsDocument, acceptanceCount = 0) {
    this.id = doc.id;
    this.type = doc.type;
    this.format = doc.format;
    this.content = doc.content;
    this.fileUrl = doc.fileUrl;
    this.isActive = doc.isActive;
    this.createdBy = doc.creator
      ? new AdminTermsCreatedByDto({
          id: doc.creator.id,
          name: doc.creator.username,
          email: doc.creator.email,
          username: doc.creator.username,
        })
      : new AdminTermsCreatedByDto();
    this.createdAt = doc.createdAt.toISOString();
    this.updatedAt = doc.updatedAt.toISOString();
    this.acceptanceCount = acceptanceCount;
  }
}
