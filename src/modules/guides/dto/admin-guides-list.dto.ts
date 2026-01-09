import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Guide } from '../entities/guide.entity';
import { GuideDto } from './guide.dto';

export class AdminGuidesListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [GuideDto] })
  data: GuideDto[];

  constructor(pagination: Pagination, guides: Guide[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = guides.map(guide => new GuideDto({ data: guide }));
  }
}
