import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, Max, IsArray, IsString } from 'class-validator';
import { parseArrayValue } from 'src/utils';

export class GetNearbyPlacesDto {
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.1)
  @Max(500)
  radius?: number = 10; // Radio en kilómetros (default 10km, max 500km)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => parseArrayValue(value))
  types?: string[]; // Tipos de lugares: ['lodging', 'restaurant', etc]
}
