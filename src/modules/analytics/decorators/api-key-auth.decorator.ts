import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

export function ApiKeyAuth() {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiSecurity('X-API-Key'),
    ApiUnauthorizedResponse({ description: 'Invalid or missing API key' }),
  );
}
