import { ApiProperty } from '@nestjs/swagger';
import { UserExplorerStatsDto } from './user-explorer-stats.dto';
import { UserExplorerLocationDto } from './user-explorer-location.dto';

export class UserExplorerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  profileImage: string;

  @ApiProperty({ example: 30 })
  age?: number;

  @ApiProperty({ type: UserExplorerLocationDto, required: false, readOnly: true })
  location?: UserExplorerLocationDto;

  @ApiProperty({ type: UserExplorerStatsDto })
  stats: UserExplorerStatsDto;
}
