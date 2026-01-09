import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Experience } from '../entities';
import { ExperienceIndexDto } from './experience-index.dto';

export class AdminExperiencesListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [ExperienceIndexDto] })
  data: ExperienceIndexDto[];

  constructor(pagination: Pagination, experiences: Experience[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = experiences.map(experience => new ExperienceIndexDto({ data: experience }));
  }
}
