import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Category } from '../../entities';
import { FullCategoryDto } from './full-category.dto';

export class AdminCategoriesListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [FullCategoryDto] })
  data: FullCategoryDto[];

  constructor(pagination: Pagination, categories: Category[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = categories as unknown as FullCategoryDto[];
  }
}
