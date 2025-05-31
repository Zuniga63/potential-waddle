import { ApiProperty } from '@nestjs/swagger';
import { AppIconDto } from '../app-icon.dto';

export class FullCategoryDto {
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
    example: true,
    description: 'Whether the category is enabled',
  })
  isEnabled: boolean;

  @ApiProperty({
    type: AppIconDto,
    readOnly: true,
    required: false,
  })
  icon?: AppIconDto;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Models associated with this category',
  })
  models?: { id: string; name: string; slug: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Places associated with this category',
  })
  places?: { id: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Restaurants associated with this category',
  })
  restaurants?: { id: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Lodgings associated with this category',
  })
  lodgings?: { id: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Experiences associated with this category',
  })
  experiences?: { id: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Commerces associated with this category',
  })
  commerces?: { id: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Guides associated with this category',
  })
  guides?: { id: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
    readOnly: true,
    required: false,
    description: 'Transports associated with this category',
  })
  transports?: { id: string }[];

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
