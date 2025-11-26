import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

import { IsEqualTo } from 'src/modules/common/decorators/is-equal-to.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    required: false,
    example: 'Clave123',
    description: 'Current password if the user has one, in this case is required',
  })
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({ required: true, example: 'Clave123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  newPassword: string;

  @ApiProperty({ required: true, example: 'Clave123' })
  @IsString()
  @IsOptional()
  @IsEqualTo('newPassword', { message: 'The passwords do not match' })
  passwordConfirmation: string;
}
