import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

import { AppPermissions } from 'src/config';
import { PERMISSION_DECORATOR_KEY } from '../decorators/required-permission.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  // * The reflector is a helper class that provides a set of methods to retrieve metadata from the context.
  // * more expecifically, the reflector is used to retirve metadate from permissions decorators
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<AppPermissions[]>(PERMISSION_DECORATOR_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) return true;

    const user: User = context.switchToHttp().getRequest().user;

    if (!user || !user.isActive) return false;
    if (user.isSuperUser) return true;

    const { role } = user;
    if (!role || !role.permissions || role.permissions.length === 0) return false;

    return requiredPermissions.every(permission => role.permissions.includes(permission));
  }
}
