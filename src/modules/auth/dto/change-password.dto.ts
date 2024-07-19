import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

import { IsEqualTo } from 'src/modules/common/decorators/is-equal-to.decorator';

export const strongPass = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;

export class ChangePasswordDto {
  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsString()
  @Matches(strongPass, {
    message: 'Password is too weak',
  })
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsString()
  @IsNotEmpty()
  @IsEqualTo('newPassword', { message: 'The passwords do not match' })
  passwordConfirmation: string;
}
