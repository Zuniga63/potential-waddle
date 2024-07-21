import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({ example: 'Facility name', description: 'The name of the facility' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'facility-name', description: 'The slug of the facility' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Facility description', description: 'The description of the facility', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Facility name', description: 'The name of the facility in English', required: false })
  @IsString()
  @IsOptional()
  name_en: string;

  @ApiProperty({ example: 'facility-name', description: 'The slug of the facility in English', required: false })
  @IsString()
  @IsOptional()
  slug_en?: string;

  @ApiProperty({
    example: 'Facility description',
    description: 'The description of the facility in English',
    required: false,
  })
  @IsString()
  @IsOptional()
  description_en?: string;

  @ApiProperty({
    example: ['model-uuid-1', 'model-uuid-2'],
    description: 'The models that the facility belongs to',
    required: false,
  })
  @IsUUID('4', { each: true })
  @IsOptional()
  models?: string[];
}
