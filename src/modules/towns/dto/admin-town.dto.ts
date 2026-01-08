import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Town } from '../entities/town.entity';

export class AdminTownDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  urbanArea: number;

  @ApiProperty()
  isEnable: boolean;

  @ApiPropertyOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  departmentName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(town: Town) {
    this.id = town.id;
    this.name = town.name;
    this.slug = town.slug;
    this.code = town.code;
    this.description = town.description;
    this.urbanArea = town.urbanArea;
    this.isEnable = town.isEnable;
    this.departmentId = town.department?.id;
    this.departmentName = town.department?.name;
    this.createdAt = town.createdAt;
    this.updatedAt = town.updatedAt;
  }
}
