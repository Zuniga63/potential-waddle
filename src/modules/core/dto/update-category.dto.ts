import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Food & Restaurants', description: 'The name of the category', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'food-restaurants', description: 'The slug of the category', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'Category for food and restaurant establishments',
    description: 'The description of the category',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['model-uuid-1', 'model-uuid-2'],
    description: 'The models that the category belongs to',
    required: false,
  })
  @IsUUID('4', { each: true })
  @IsOptional()
  models?: string[];

  @ApiProperty({
    example: true,
    description: 'Whether the category is enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
