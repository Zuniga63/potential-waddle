import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { User } from '../entities/user.entity';
import { AdminUserDto } from './admin-user.dto';

export class AdminUsersListDto implements Pagination {
  @ApiProperty({ default: 1, description: 'Current page' })
  currentPage: number;

  @ApiProperty({ default: 1, description: 'Total pages' })
  pages: number;

  @ApiProperty({ default: 0, description: 'Total count' })
  count: number;

  @ApiProperty({ type: [AdminUserDto] })
  data: AdminUserDto[];

  constructor(pagination: Pagination, users: User[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = users.map(user => new AdminUserDto(user));
  }
}
