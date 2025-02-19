import { ApiProperty } from '@nestjs/swagger';

export class UserExplorerLocationDto {
  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  countryState?: string | null;

  @ApiProperty({ required: false })
  city?: string | null;
}
