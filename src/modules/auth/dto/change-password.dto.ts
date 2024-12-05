import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

import { IsEqualTo } from 'src/modules/common/decorators/is-equal-to.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    required: false,
    example: 'Clave123*',
    description: 'Current password if the user has one, in this case is required',
  })
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsString()
  @Matches(/^.*[a-z].*$/, { message: 'La contraseña debe contener al menos una letra minúscula' })
  @Matches(/^.*[A-Z].*$/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
  @Matches(/^.*[0-9].*$/, { message: 'La contraseña debe contener al menos un número' })
  @Matches(/^.*[^A-Za-z0-9].*$/, { message: 'La contraseña debe contener al menos un carácter especial' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  newPassword: string;

  @ApiProperty({ required: true, example: 'Clave123*' })
  @IsString()
  @IsOptional()
  @IsEqualTo('newPassword', { message: 'The passwords do not match' })
  passwordConfirmation: string;
}
