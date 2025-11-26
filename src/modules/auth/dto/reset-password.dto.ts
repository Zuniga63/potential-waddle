import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsEqualTo } from 'src/modules/common/decorators/is-equal-to.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received by email',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @ApiProperty({
    description: 'New password for the user account',
    example: 'Clave123',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm the new password',
    example: 'Clave123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsEqualTo('newPassword', { message: 'Passwords do not match' })
  passwordConfirmation: string;
}
