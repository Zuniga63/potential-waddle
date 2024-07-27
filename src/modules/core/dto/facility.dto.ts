import { ApiProperty } from '@nestjs/swagger';
import { Facility } from '../entities';

export class FacilityDto {
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
    format: 'date-time',
    example: '2021-09-03T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    format: 'date-time',
    example: '2021-09-03T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(facility?: Facility) {
    if (!facility) return;

    this.id = facility.id;
    this.name = facility.name;
    this.slug = facility.slug;
    this.description = facility.description;
    this.updatedAt = facility.updatedAt;
    this.createdAt = facility.createdAt;
  }
}
