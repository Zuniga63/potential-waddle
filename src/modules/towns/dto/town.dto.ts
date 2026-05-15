import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    example: 'slug-code',
    description: 'The code of the town',
    required: false,
  })
  code?: string;

  @ApiProperty({
    example: 'San Rafael is a town in the department of Antioquia, Colombia.',
    description: 'The description of the town',
    required: false,
  })
  description?: string;

  @ApiPropertyOptional({
    example: 6.295145676,
    description: 'Latitude of the town urban center',
  })
  latitude?: number;

  @ApiPropertyOptional({
    example: -75.027964772,
    description: 'Longitude of the town urban center',
  })
  longitude?: number;

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
    const point = town.location as any;
    if (point?.coordinates?.length === 2) {
      this.longitude = point.coordinates[0];
      this.latitude = point.coordinates[1];
    }
    this.createdAt = town.createdAt;
    this.updatedAt = town.updatedAt;
  }
}
