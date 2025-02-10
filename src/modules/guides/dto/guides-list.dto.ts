import { ApiProperty } from '@nestjs/swagger';
import { GuideDto } from './guide.dto';
import { Pagination } from 'src/modules/common/interfaces';
import { Guide } from '../entities/guide.entity';

export class GuidesListDto implements Pagination {
  @ApiProperty({ default: 1, description: 'Current page' })
  currentPage: number;

  @ApiProperty({ default: 1, description: 'Total pages' })
  pages: number;

  @ApiProperty({ default: 0, description: 'Total count' })
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
