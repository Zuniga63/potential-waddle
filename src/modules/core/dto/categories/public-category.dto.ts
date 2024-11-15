import { ApiProperty } from '@nestjs/swagger';
import { AppIconDto } from '../app-icon.dto';

export class PublicCategoryDto {
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
    type: AppIconDto,
    readOnly: true,
    required: false,
  })
  icon: AppIconDto | null;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    nullable: true,
  })
  models?: { id: string; name: string }[];

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
}
