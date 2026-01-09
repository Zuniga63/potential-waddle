import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Place } from '../entities';
import { PlaceDto } from './place.dto';

export class AdminPlacesListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [PlaceDto] })
  data: PlaceDto[];

  constructor(pagination: Pagination, places: Place[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = places.map(place => new PlaceDto(place));
  }
}
