import { ApiProperty } from '@nestjs/swagger';

export class TermsActiveIdsDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', nullable: true })
  user: string | null;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', nullable: true })
  lodging: string | null;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', nullable: true })
  restaurant: string | null;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', nullable: true })
  commerce: string | null;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', nullable: true })
  transport: string | null;

  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', nullable: true })
  guide: string | null;
}

export class TermsStatusDto {
  @ApiProperty({ example: true })
  hasAcceptedUserTerms: boolean;

  @ApiProperty({ example: false })
  hasAcceptedLodgingTerms: boolean;

  @ApiProperty({ example: false })
  hasAcceptedRestaurantTerms: boolean;

  @ApiProperty({ example: false })
  hasAcceptedCommerceTerms: boolean;

  @ApiProperty({ example: false })
  hasAcceptedTransportTerms: boolean;

  @ApiProperty({ example: false })
  hasAcceptedGuideTerms: boolean;

  @ApiProperty({ type: TermsActiveIdsDto })
  activeDocumentIds: TermsActiveIdsDto;
}
