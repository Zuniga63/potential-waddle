import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsValidPermission } from '../decorators/is-valid-permission.decorator';
import { AppPermissions } from 'src/config';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Admin',
    description: 'The name of the role',
    minLength: 3,
    maxLength: 50,
  })
  @MaxLength(50)
  @MinLength(3)
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The permissions of the role',
    example: [
      AppPermissions.READ_ROLE,
      AppPermissions.CREATE_ROLE,
      AppPermissions.UPDATE_ROLE,
      AppPermissions.DELETE_ROLE,
    ],
    isArray: true,
    enum: AppPermissions,
    required: false,
  })
  @IsValidPermission({ message: 'One or more permissions are invalid', each: true })
  @IsNotEmpty()
  @IsArray()
  @IsOptional()
  permissions: AppPermissions[];
}
