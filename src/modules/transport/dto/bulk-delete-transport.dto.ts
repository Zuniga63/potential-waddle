import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteTransportDto {
  @ApiProperty({
    description: 'UUIDs of transports to delete',
    example: ['11111111-1111-1111-1111-111111111111'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: string[];
}
