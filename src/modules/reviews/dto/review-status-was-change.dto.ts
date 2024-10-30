import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatusEnum } from '../enums';

export class ReviewStatusWasChangeDto {
  @ApiProperty()
  ok: boolean;

  @ApiProperty({ description: 'Review ID', example: 'f7b1f1b1-7b1f-1b7b-1f7b-1f7b1f1b7b1f' })
  reviewId: string;

  @ApiProperty({ enum: ReviewStatusEnum, example: ReviewStatusEnum.APPROVED })
  status: ReviewStatusEnum;
}
