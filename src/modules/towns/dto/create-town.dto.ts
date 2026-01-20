import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTownDto {
  @ApiProperty({
    example: 'San Rafael',
    description: 'The name of the town',
    minLength: 3,
  })
  @MinLength(3)
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'sanrafael',
    description: 'The slug for subdomain mapping',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    example: '05667',
    description: 'The code of the town',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: 'San Rafael is a town in the department of Antioquia, Colombia.',
    description: 'The description of the town',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Donde la naturaleza te abraza',
    description: 'The slogan for the town hero banner',
  })
  @IsOptional()
  @IsString()
  slogan?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Urban area in km²',
  })
  @IsOptional()
  @IsNumber()
  urbanArea?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the town is enabled',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnable?: boolean;

  @ApiPropertyOptional({
    example: 'en',
    description: 'The language for property',
    default: 'es',
  })
  @IsOptional()
  @IsEnum(['es', 'en'])
  lang?: string;

  @ApiPropertyOptional({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the municipality/department',
  })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  // ============================================================================
  // TOWN INFO FIELDS
  // ============================================================================

  @ApiPropertyOptional({
    example: 50000,
    description: 'Population of the town',
  })
  @IsOptional()
  @IsNumber()
  population?: number;

  @ApiPropertyOptional({
    example: '120 km de Medellin',
    description: 'Distance to the capital city',
  })
  @IsOptional()
  @IsString()
  distanceToCapital?: string;

  @ApiPropertyOptional({
    example: 'Oriente Antioqueno',
    description: 'Geographic location/region',
  })
  @IsOptional()
  @IsString()
  ubication?: string;

  @ApiPropertyOptional({
    example: 'San Carlos de las Minas',
    description: 'Official name of the town',
  })
  @IsOptional()
  @IsString()
  officialName?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Altitude in meters above sea level',
  })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiPropertyOptional({
    example: 24,
    description: 'Average temperature in Celsius',
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;
}
