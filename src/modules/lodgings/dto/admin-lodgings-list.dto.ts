import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Lodging } from '../entities';
import { LodgingIndexDto } from './lodging-index.dto';

export class AdminLodgingsListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [LodgingIndexDto] })
  data: LodgingIndexDto[];

  constructor(pagination: Pagination, lodgings: Lodging[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = lodgings.map(lodging => new LodgingIndexDto(lodging));
  }
}
