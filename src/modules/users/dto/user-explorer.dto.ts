import { ApiProperty } from '@nestjs/swagger';
import { UserExplorerStatsDto } from './user-explorer-stats.dto';

export class UserExplorerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  profileImage: string;

  @ApiProperty({ type: UserExplorerStatsDto })
  stats: UserExplorerStatsDto;
}
