import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../entities';

export class DepartmentDto {
  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the municipality',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    example: 'Antioquia',
    description: 'The department of the municipality',
    readOnly: true,
  })
  name: string;

  @ApiProperty({
    example: 'Medellín',
    description: 'The name of the municipality',
    readOnly: true,
  })
  capital?: string;

  @ApiProperty({
    example: '5000',
    description: 'The postal calling code of the municipality',
    readOnly: true,
  })
  callingCode: string;

  @ApiProperty({
    example: '05001',
    description: 'The postal code of the municipality',
    readOnly: true,
  })
  postalCode: string;

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

  constructor(municipality?: Department) {
    if (!municipality) return;

    this.id = municipality.id;
    this.name = municipality.name;
    this.capital = municipality.capital;
    this.createdAt = municipality.createdAt;
    this.updatedAt = municipality.updatedAt;
  }
}
