import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateLodgingRoomTypeDto } from './create-lodging-room-type.dto';

export class UpdateLodgingRoomTypeDto extends CreateLodgingRoomTypeDto {
  @ApiProperty({
    description: 'Unique identifier of the room type (for updates)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  id?: string;
}
