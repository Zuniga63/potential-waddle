import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Commerce } from '../entities';
import { CommerceIndexDto } from './commerce-index.dto';

export class AdminCommerceListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [CommerceIndexDto] })
  data: CommerceIndexDto[];

  constructor(pagination: Pagination, commerces: Commerce[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = commerces.map(commerce => new CommerceIndexDto(commerce));
  }
}
