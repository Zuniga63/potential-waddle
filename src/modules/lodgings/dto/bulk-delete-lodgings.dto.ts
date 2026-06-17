import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteLodgingsDto {
  @ApiProperty({
    description: 'UUIDs of lodgings to delete',
    example: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: string[];
}
