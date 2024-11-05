import { ApiProperty } from '@nestjs/swagger';

export class UserExplorerStatsDto {
  @ApiProperty()
  points: number;

  @ApiProperty()
  distanceTraveled: number;

  @ApiProperty()
  visitedPlaces: number;
}
