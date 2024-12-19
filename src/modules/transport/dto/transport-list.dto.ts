import { ApiProperty } from '@nestjs/swagger';
import { TransportDto } from './transport.dto';
import { Pagination } from 'src/modules/common/interfaces';
import { Transport } from '../entities';

export class TransportListDto implements Pagination {
  @ApiProperty({ default: 1, description: 'Current page' })
  currentPage: number;

  @ApiProperty({ default: 1, description: 'Total pages' })
  pages: number;

  @ApiProperty({ default: 0, description: 'Total count' })
  count: number;

  @ApiProperty({ type: [TransportDto] })
  data: TransportDto[];

  constructor(pagination: Pagination, transports: Transport[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = transports.map(transport => new TransportDto({ data: transport }));
  }
}
