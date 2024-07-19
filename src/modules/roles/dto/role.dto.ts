import { ApiProperty } from '@nestjs/swagger';
import { AppPermissions } from 'src/config';

export class RoleDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The id of the role' })
  id: string;

  @ApiProperty({ example: 'admin', description: 'The name of the role' })
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
  permissions: AppPermissions[];
}
