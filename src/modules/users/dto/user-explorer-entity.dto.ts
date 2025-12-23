import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatusEnum } from 'src/modules/reviews/enums';

export class UserExplorerEntityDto {
  @ApiProperty({ description: 'Entity ID' })
  id: string;

  @ApiProperty({ description: 'Entity name or title' })
  name: string;

  @ApiProperty({ description: 'Entity slug' })
  slug: string;

  @ApiProperty({ description: 'Entity image URL' })
  image: string;

  @ApiProperty({ description: 'Entity description', required: false })
  description?: string;

  @ApiProperty({ description: 'If the entity has been visited/reviewed by the user' })
  isVisited: boolean;

  @ApiProperty({ description: 'User rating for the entity', required: false })
  rating?: number;

  @ApiProperty({ description: 'Review status', enum: ReviewStatusEnum })
  status: ReviewStatusEnum;
}
