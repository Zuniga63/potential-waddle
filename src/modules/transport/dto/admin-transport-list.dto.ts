import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Transport } from '../entities';
import { TransportDto } from './transport.dto';

export class AdminTransportListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
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
