import { applyDecorators, UseGuards } from '@nestjs/common';
import { AppPermissions } from 'src/config';
import { JwtAuthGuard, PermissionsGuard } from '../guards';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RequirePermissions } from './required-permission.decorator';

export function Auth(...permissions: AppPermissions[]) {
  const decorators = [
    UseGuards(JwtAuthGuard, PermissionsGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Access to this route requires authentication.' }),
  ];

  if (permissions.length) {
    decorators.push(
      RequirePermissions(...permissions),
      ApiForbiddenResponse({
        description: `To access this route, the following permissions are required: ${permissions.join(', ')}`,
      }),
    );
  }

  return applyDecorators(...decorators);
}
