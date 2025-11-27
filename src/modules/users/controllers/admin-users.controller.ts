import { Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Body } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from 'src/config';
import { GenericFindAllFilters } from 'src/modules/common/decorators';
import { UsersService } from '../services';
import { AdminUsersFiltersDto, AdminUsersListDto, AdminUserDto } from '../dto';
import { UserSortByEnum } from '../constants';
import { AdminUsersFiltersApiQueries } from '../decorators';

@Controller('admin/users')
@ApiTags(SwaggerTags.Users)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with filters and pagination (Admin)' })
  @AdminUsersFiltersApiQueries()
  @ApiOkResponse({ description: 'Return paginated users list', type: AdminUsersListDto })
  findAll(@GenericFindAllFilters(AdminUsersFiltersDto, UserSortByEnum) filters: AdminUsersFiltersDto) {
    return this.usersService.findAllAdmin({ filters });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  @ApiOkResponse({ description: 'Return user details', type: AdminUserDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOneAdmin(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status (Admin)' })
  @ApiOkResponse({ description: 'User status updated' })
  toggleActive(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.toggleActive(id);
  }

  @Patch(':id/toggle-super-user')
  @ApiOperation({ summary: 'Toggle user super user status (Admin)' })
  @ApiOkResponse({ description: 'User super user status updated' })
  toggleSuperUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.toggleSuperUser(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (Admin)' })
  @ApiOkResponse({ description: 'User deleted' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.remove(id);
  }
}
