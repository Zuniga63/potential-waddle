import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTownDto {
  @ApiProperty({
    example: 'San Rafael',
    description: 'The name of the town',
    minLength: 3,
  })
  @MinLength(3)
  @IsString()
  name: string;

  @ApiProperty({
    example: 'San Rafael is a town in the department of Antioquia, Colombia.',
    description: 'The description of the town',
    minLength: 3,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'en',
    description: 'The language for property',
    default: 'es',
    required: false,
  })
  @IsOptional()
  @IsEnum(['es', 'en'])
  lang?: string;

  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the municipality',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;
}
