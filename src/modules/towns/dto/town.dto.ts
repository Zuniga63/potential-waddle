import { ApiProperty } from '@nestjs/swagger';
import { DepartmentDto } from './department.dto';
import { Town } from '../entities';

export class TownDto {
  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the town',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    type: DepartmentDto,
  })
  department: DepartmentDto;

  @ApiProperty({
    example: 'San Rafael',
    description: 'The name of the town',
  })
  name: string;

  @ApiProperty({
    example: 'San Rafael is a town in the department of Antioquia, Colombia.',
    description: 'The description of the town',
    required: false,
  })
  description: string;

  @ApiProperty({
    example: 'https://image.jpg',
    description: 'The shield of the town',
    readOnly: true,
    required: false,
  })
  flag?: string;

  @ApiProperty({
    example: 'https://image.jpg',
    description: 'The shield of the town',
    readOnly: true,
    required: false,
  })
  shield?: string;

  @ApiProperty({
    example: 'https://image.jpg',
    description: 'The shield of the town',
    readOnly: true,
    required: false,
  })
  image?: string;

  @ApiProperty({
    example: '5000',
    description: 'The postal calling code of the town',
    readOnly: true,
    required: false,
  })
  postalCode?: string;

  @ApiProperty({
    example: 'https://wikpedia.com',
    description: 'The shield of the town',
    readOnly: true,
    required: false,
  })
  url?: string;

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

  constructor(town?: Town) {
    if (!town) return;

    this.id = town.id;
    this.department = new DepartmentDto(town.department);
    this.name = town.name;
    this.description = town.description;
    this.url = town.url;
    this.createdAt = town.createdAt;
    this.updatedAt = town.updatedAt;
  }
}
