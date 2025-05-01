import type { User } from 'src/modules/users/entities';
import type { GoogleReviewsFiltersDto } from '../dto/google-reviews-filters.dto';

export interface GoogleReviewsFindAllParams {
  filters?: GoogleReviewsFiltersDto;
  entityId?: string;
  entityType?: string;
  user?: User | null;
}
