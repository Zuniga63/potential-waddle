import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiPropertyOptional({ description: 'Custom schema ID for Kmizen extraction' })
  @IsOptional()
  @IsString()
  schemaId?: string;
}
