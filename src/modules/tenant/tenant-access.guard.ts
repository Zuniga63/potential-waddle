import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TENANT_ID_KEY } from './tenant.interceptor';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request[TENANT_ID_KEY];

    // If no tenant in request, allow (might be main domain)
    if (!tenantId) {
      return true;
    }

    // If no user, deny
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Super users can access everything
    if (user.isSuperUser) {
      return true;
    }

    // Check if user has access to this town
    const userTowns = user.towns || [];
    const hasAccess = userTowns.some((town: any) => town.id === tenantId);

    if (!hasAccess) {
      throw new ForbiddenException('No tienes acceso a este municipio');
    }

    return true;
  }
}
