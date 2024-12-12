import { ApiProperty } from '@nestjs/swagger';

export class UserLocationDto {
  @ApiProperty({ example: '123.456.789.0' })
  country: string | null;

  @ApiProperty({ example: null, nullable: true })
  countryState: string | null;

  @ApiProperty({ example: null, nullable: true })
  city: string | null;
}
