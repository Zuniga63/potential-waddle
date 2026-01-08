import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_ID_KEY, TENANT_SLUG_KEY } from './tenant.interceptor';

export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext): string | null => {
  const request = ctx.switchToHttp().getRequest();
  return request[TENANT_ID_KEY] || null;
});

export const TenantSlug = createParamDecorator((data: unknown, ctx: ExecutionContext): string | null => {
  const request = ctx.switchToHttp().getRequest();
  return request[TENANT_SLUG_KEY] || null;
});
