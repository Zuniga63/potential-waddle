import { Pagination } from '../../common/interfaces/pagination.interface';

export class AdminBadgesListDto implements Pagination {
  currentPage: number;
  pages: number;
  count: number;
  data: any[];
}
