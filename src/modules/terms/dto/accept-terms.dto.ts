import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { TermsContextEnum } from '../interfaces';

export class AcceptTermsDto {
  @ApiProperty({
    enum: TermsContextEnum,
    example: TermsContextEnum.UserLoginCheck,
    description: 'Where the acceptance is being recorded from',
  })
  @IsEnum(TermsContextEnum)
  context: TermsContextEnum;
}
