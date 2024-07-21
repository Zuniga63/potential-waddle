import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Facility name', description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'facility-name', description: 'The slug of the category' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Facility description', description: 'The description of the category', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Facility name', description: 'The name of the category in English', required: false })
  @IsString()
  @IsOptional()
  name_en: string;

  @ApiProperty({ example: 'facility-name', description: 'The slug of the category in English', required: false })
  @IsString()
  @IsOptional()
  slug_en?: string;

  @ApiProperty({
    example: 'Facility description',
    description: 'The description of the category in English',
    required: false,
  })
  @IsString()
  @IsOptional()
  description_en?: string;

  @ApiProperty({
    example: ['model-uuid-1', 'model-uuid-2'],
    description: 'The models that the category belongs to',
    required: false,
  })
  @IsUUID('4', { each: true })
  @IsOptional()
  models?: string[];
}
