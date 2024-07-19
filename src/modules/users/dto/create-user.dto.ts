import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

import { IsEqualTo } from 'src/modules/common/decorators/is-equal-to.decorator';

export const strongPass = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;

export class CreateUserDto {
  @ApiProperty({ required: true, example: 'Jhon Doe' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ required: true, example: 'jhondoe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsString()
  @Matches(strongPass, {
    message: 'Password is too weak',
  })
  @MinLength(8)
  password: string;

  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsString()
  @IsNotEmpty()
  @IsEqualTo('password', { message: 'The passwords do not match' })
  passwordConfirmation: string;
}
