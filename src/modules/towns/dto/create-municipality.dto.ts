import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMunicipalityDto {
  @ApiProperty({
    example: 'Antioquia',
    description: 'The name of the municipality',
    minLength: 3,
    maxLength: 50,
  })
  @MaxLength(50)
  @MinLength(3)
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Medellín',
    description: 'The capital of the municipality',
    minLength: 3,
    maxLength: 50,
    required: false,
  })
  @MaxLength(50)
  @MinLength(3)
  @IsString()
  capital?: string;

  @ApiProperty({
    example: '604',
    description: 'The calling code of the municipality',
    required: false,
  })
  @MaxLength(10)
  @IsString()
  callingCode?: string;

  @ApiProperty({
    example: '0500',
    description: 'The postal code of the municipality',
    required: false,
  })
  @MaxLength(10)
  @IsString()
  postalCode?: string;
}
