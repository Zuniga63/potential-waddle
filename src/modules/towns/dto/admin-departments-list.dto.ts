import { Pagination } from '../../common/interfaces/pagination.interface';

export class AdminDepartmentsListDto implements Pagination {
  currentPage: number;
  pages: number;
  count: number;
  data: any[];
}
