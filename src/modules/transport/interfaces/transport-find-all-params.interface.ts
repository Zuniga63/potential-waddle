import type { User } from 'src/modules/users/entities';
import type { TransportFiltersDto } from '../dto';

export interface TransportFindAllParams {
  filters?: TransportFiltersDto;
  user?: User | null;
}
