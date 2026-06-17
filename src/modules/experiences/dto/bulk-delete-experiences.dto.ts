import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteExperiencesDto {
  @ApiProperty({
    description: 'UUIDs of experiences to delete',
    example: ['11111111-1111-1111-1111-111111111111'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: string[];
}
