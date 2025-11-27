import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { UserSortByEnum } from '../constants';

export function AdminUsersFiltersApiQueries() {
  return applyDecorators(
    ApiQuery({ name: 'search', required: false, description: 'Search by username or email' }),
    ApiQuery({
      name: 'sort-by',
      required: false,
      enum: [...Object.values(UserSortByEnum), ...Object.values(UserSortByEnum).map(v => `-${v}`)],
      description: 'Sort field. Use "-" prefix for descending order',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiQuery({ name: 'is-active', required: false, type: Boolean, description: 'Filter by active status' }),
    ApiQuery({ name: 'is-super-user', required: false, type: Boolean, description: 'Filter by super user status' }),
    ApiQuery({ name: 'email-verified', required: false, type: Boolean, description: 'Filter by email verification' }),
    ApiQuery({ name: 'created-from', required: false, type: String, description: 'Filter from date (ISO format)' }),
    ApiQuery({ name: 'created-to', required: false, type: String, description: 'Filter to date (ISO format)' }),
  );
}
