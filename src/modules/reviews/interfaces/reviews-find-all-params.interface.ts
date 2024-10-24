import type { User } from 'src/modules/users/entities';
import type { ReviewFindAllQueriesDto } from '../dto';

export interface ReviewsFindAllParams {
  queries: ReviewFindAllQueriesDto;
  user?: User;
}
