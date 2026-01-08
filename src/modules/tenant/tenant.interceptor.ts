import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';

export const TENANT_HEADER = 'x-tenant';
export const TENANT_ID_KEY = 'tenantId';
export const TENANT_SLUG_KEY = 'tenantSlug';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantService: TenantService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Try to get tenant from header first (sent by frontend)
    let slug = request.headers[TENANT_HEADER];

    // If not in header, try to extract from Origin
    if (!slug) {
      const origin = request.headers.origin || request.headers.referer;
      slug = this.tenantService.extractSlugFromOrigin(origin);
    }

    // If we have a slug, resolve the town
    if (slug) {
      const town = await this.tenantService.getTownBySlug(slug);
      if (town) {
        request[TENANT_ID_KEY] = town.id;
        request[TENANT_SLUG_KEY] = slug;
      }
    }

    return next.handle();
  }
}
