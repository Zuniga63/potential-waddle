import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/modules/common/interfaces';
import { Restaurant } from '../entities';
import { RestaurantIndexDto } from './restaurant-index.dto';

export class AdminRestaurantsListDto implements Pagination {
  @ApiProperty({ description: 'Current page' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ type: [RestaurantIndexDto] })
  data: RestaurantIndexDto[];

  constructor(pagination: Pagination, restaurants: Restaurant[]) {
    this.currentPage = pagination.currentPage;
    this.pages = pagination.pages;
    this.count = pagination.count;
    this.data = restaurants.map(restaurant => new RestaurantIndexDto({ data: restaurant }));
  }
}
