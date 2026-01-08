import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Town } from '../entities/town.entity';
import { AdminTownDto } from './admin-town.dto';

export class AdminTownsListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [AdminTownDto] })
  data: AdminTownDto[];

  constructor(pagination: Pagination, towns: Town[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = towns.map(town => new AdminTownDto(town));
  }
}
