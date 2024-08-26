import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities';
import { AppIconDto } from './app-icon.dto';

export class CategoryDto {
  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the category',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    example: 'Food',
    description: 'The name of the category',
  })
  name: string;

  @ApiProperty({
    example: 'food',
    description: 'The slug of the category',
  })
  slug: string;

  @ApiProperty({
    example: 'The best food in the world',
    description: 'The description of the category',
    required: false,
  })
  description?: string;

  @ApiProperty({
    type: AppIconDto,
    readOnly: true,
    required: false,
  })
  icon?: AppIconDto;

  @ApiProperty({
    format: 'date-time',
    example: '2021-09-03T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    format: 'date-time',
    example: '2021-09-03T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(category?: Category) {
    if (!category) return;

    this.id = category.id;
    this.name = category.name;
    this.slug = category.slug;
    this.description = category.description;
    this.icon = category.icon ? new AppIconDto(category.icon) : undefined;
    this.updatedAt = category.updatedAt;
    this.createdAt = category.createdAt;
  }
}
