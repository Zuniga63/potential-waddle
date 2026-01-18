import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard, SuperAdminGuard } from '../guards';

export function SuperAdmin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, SuperAdminGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Access to this route requires authentication.' }),
    ApiForbiddenResponse({ description: 'Only super administrators can access this resource.' }),
  );
}
