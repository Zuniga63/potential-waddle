import { ApiProperty } from '@nestjs/swagger';

import { AdminTermsDocumentDto } from './admin-terms-document.dto';

export class AdminTermsListDto {
  @ApiProperty({ type: [AdminTermsDocumentDto] })
  data: AdminTermsDocumentDto[];

  constructor(data: AdminTermsDocumentDto[]) {
    this.data = data;
  }
}
