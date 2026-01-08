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
}
