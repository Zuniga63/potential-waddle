import { ApiProperty } from '@nestjs/swagger';

import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

import { IsEqualTo } from 'src/modules/common/decorators/is-equal-to.decorator';

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
  /*@Matches(/^.*[a-z].*$/, { message: 'La contraseña debe contener al menos una letra minúscula' })
  @Matches(/^.*[A-Z].*$/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
  @Matches(/^.*[0-9].*$/, { message: 'La contraseña debe contener al menos un número' })
  @Matches(/^.*[^A-Za-z0-9].*$/, { message: 'La contraseña debe contener al menos un carácter especial' }) */
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsString()
  @IsNotEmpty()
  @IsEqualTo('password', { message: 'The passwords do not match' })
  passwordConfirmation?: string;

  @ApiProperty({ required: false, example: '1990-01-01' })
  @IsDateString({}, { message: 'Invalid date format' })
  @IsOptional()
  birthDate?: Date;

  @ApiProperty({ required: false, example: 'United States' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ required: false, example: 'California' })
  @IsString()
  @IsOptional()
  countryState?: string;

  @ApiProperty({ required: false, example: 'Los Angeles' })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({ required: false, description: 'Cloudflare Turnstile token for bot protection' })
  @IsString()
  @IsOptional()
  turnstileToken?: string;
}
