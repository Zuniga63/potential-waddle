import { ArrayNotEmpty, IsArray, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderItem {
  @ApiProperty({
    description: 'The ID of the image',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The new order position of the image (zero-based)',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  order: number;
}

export class ReorderImagesDto {
  @ApiProperty({
    description: 'Array of items to reorder',
    type: [ReorderItem],
  })
  @IsArray()
  @ArrayNotEmpty()
  newOrder: ReorderItem[];
}
