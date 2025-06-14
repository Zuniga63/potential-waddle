import { ApiProperty } from '@nestjs/swagger';

export class HomeItemDto {
  @ApiProperty({ description: 'The unique identifier' })
  id: string;

  @ApiProperty({ description: 'The name of the item' })
  name: string;

  @ApiProperty({ description: 'The slug of the item' })
  slug: string;

  @ApiProperty({ description: 'The first image URL', required: false })
  image?: string;
}

export class HomeDataDto {
  @ApiProperty({ type: [HomeItemDto], description: 'Random places' })
  places: HomeItemDto[];

  @ApiProperty({ type: [HomeItemDto], description: 'Random lodgings' })
  lodgings: HomeItemDto[];

  @ApiProperty({ type: [HomeItemDto], description: 'Random restaurants' })
  restaurants: HomeItemDto[];

  @ApiProperty({ type: [HomeItemDto], description: 'Random experiences' })
  experiences: HomeItemDto[];
}
