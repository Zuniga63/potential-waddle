import { SetMetadata } from '@nestjs/common';
import { AppPermissions } from 'src/config';

export const PERMISSION_DECORATOR_KEY = 'permissions';
export const RequirePermissions = (...permissions: AppPermissions[]) =>
  SetMetadata(PERMISSION_DECORATOR_KEY, permissions);
