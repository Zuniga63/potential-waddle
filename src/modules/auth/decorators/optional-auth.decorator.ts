import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtOptionalAuthGuard } from '../guards';
import { ApiBearerAuth } from '@nestjs/swagger';

export function OptionalAuth() {
  return applyDecorators(UseGuards(JwtOptionalAuthGuard), ApiBearerAuth());
}
