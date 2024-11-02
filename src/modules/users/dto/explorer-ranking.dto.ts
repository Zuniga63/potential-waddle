import { ApiProperty } from '@nestjs/swagger';

export class ExplorerUser {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  profileImage: string;
}

export class ExplorerStatsDto {
  @ApiProperty()
  totalPoints: number;
  @ApiProperty()
  totalDistance: number;
  @ApiProperty()
  visitedPlaces: number;
}

export class ExplorerRankingDto {
  @ApiProperty()
  user: ExplorerUser;
  @ApiProperty()
  stats: ExplorerStatsDto;
}
