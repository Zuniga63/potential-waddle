import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateFacilityDto } from './create-facility.dto';

export class UpdateFacilityDto extends PartialType(CreateFacilityDto) {
  @ApiProperty({ example: 'Facility name', description: 'The name of the facility', required: false })
  name?: string;

  @ApiProperty({ example: 'facility-name', description: 'The slug of the facility', required: false })
  slug?: string;

  @ApiProperty({ example: 'Facility description', description: 'The description of the facility', required: false })
  description?: string;

  @ApiProperty({ example: 'Facility name', description: 'The name of the facility in English', required: false })
  name_en?: string;

  @ApiProperty({ example: 'facility-name', description: 'The slug of the facility in English', required: false })
  slug_en?: string;

  @ApiProperty({
    example: 'Facility description',
    description: 'The description of the facility in English',
    required: false,
  })
  description_en?: string;

  @ApiProperty({
    example: ['model-uuid-1', 'model-uuid-2'],
    description: 'The models that the facility belongs to',
    required: false,
  })
  models?: string[];
} 