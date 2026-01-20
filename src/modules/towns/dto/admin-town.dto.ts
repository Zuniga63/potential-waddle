import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Town } from '../entities/town.entity';
import { TownImageDto } from './town-image.dto';

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

  @ApiPropertyOptional()
  slogan?: string;

  @ApiProperty()
  urbanArea: number;

  @ApiProperty()
  isEnable: boolean;

  @ApiPropertyOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  departmentName?: string;

  @ApiPropertyOptional({ type: [TownImageDto] })
  images?: TownImageDto[];

  // TownInfo fields
  @ApiPropertyOptional()
  population?: number;

  @ApiPropertyOptional()
  distanceToCapital?: string;

  @ApiPropertyOptional()
  ubication?: string;

  @ApiPropertyOptional()
  officialName?: string;

  @ApiPropertyOptional()
  altitude?: number;

  @ApiPropertyOptional()
  temperature?: number;

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
    this.slogan = town.slogan;
    this.urbanArea = town.urbanArea;
    this.isEnable = town.isEnable;
    this.departmentId = town.department?.id;
    this.departmentName = town.department?.name;
    this.createdAt = town.createdAt;
    this.updatedAt = town.updatedAt;

    if (town.images) {
      this.images = town.images
        .sort((a, b) => a.order - b.order)
        .map(img => new TownImageDto(img));
    }

    // TownInfo fields
    if (town.info) {
      this.population = town.info.population;
      this.distanceToCapital = town.info.distanceToCapital;
      this.ubication = town.info.ubication;
      this.officialName = town.info.officialName;
      this.altitude = town.info.altitude;
      this.temperature = town.info.temperature;
    }
  }
}
