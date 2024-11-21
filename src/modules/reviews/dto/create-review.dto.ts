import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

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
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({
    description: 'Is the review public',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean;

  @ApiProperty({
    description: 'The images of the review',
    type: [String],
    format: 'binary',
    required: false,
  })
  @IsArray()
  @IsOptional()
  images: Express.Multer.File[];
}
