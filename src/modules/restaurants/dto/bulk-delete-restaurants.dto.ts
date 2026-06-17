import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteRestaurantsDto {
  @ApiProperty({
    description: 'UUIDs of restaurants to delete',
    example: ['11111111-1111-1111-1111-111111111111'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: string[];
}
