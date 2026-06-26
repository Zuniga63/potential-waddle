import { Pagination } from 'src/modules/common/interfaces/pagination.interface';

export class SyncHistoryItemDto {
  id: string;
  trigger: 'cron' | 'manual';
  status: 'running' | 'success' | 'error' | 'skipped';
  reviewsNew: number | null;
  reviewsTotal: number | null;
  startedAt: Date;
  endedAt: Date | null;
  errorMessage: string | null;
}

export class SyncHistoryResponseDto extends Pagination {
  /** Current page number (1-based). */
  declare currentPage: number;
  data: SyncHistoryItemDto[];
}
