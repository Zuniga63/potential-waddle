import { ApiProperty } from '@nestjs/swagger';

import { UserDto } from '../../users/dto/user.dto';
import { TermsStatusDto } from '../../terms/dto/terms-status.dto';

export class ProfileResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ type: TermsStatusDto })
  termsStatus: TermsStatusDto;

  constructor(partial?: Partial<ProfileResponseDto>) {
    if (partial) Object.assign(this, partial);
  }
}
