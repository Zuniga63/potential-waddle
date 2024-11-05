import { ApiProperty } from '@nestjs/swagger';

export class UserExplorerPlaceDto {
  @ApiProperty({ description: 'Place ID' })
  id: string;

  @ApiProperty({ description: 'Place name' })
  name: string;

  @ApiProperty({ description: 'Place slug' })
  slug: string;

  @ApiProperty({ description: 'Place image' })
  image: string;

  @ApiProperty({ description: 'Place description' })
  description: string;

  @ApiProperty({ description: 'If the place has been visited' })
  isVisited: boolean;

  @ApiProperty({ description: 'User rating for the place' })
  rating?: number;
}
