import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'The rating of the review',
    example: 5,
  })
  @Max(5)
  @Min(1)
  @IsNumber()
  @Type(() => Number)
  rating: number;

  @ApiProperty({
    description: 'The comment of the review',
    example: 'This is a great place to visit!',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({
    description: 'Is the review public',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean;
}
