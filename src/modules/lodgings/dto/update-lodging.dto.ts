import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLodgingDto } from './create-lodging.dto';
import { UpdateLodgingRoomTypeDto } from './update-lodging-room-type.dto';

export class UpdateLodgingDto extends PartialType(OmitType(CreateLodgingDto, ['slug', 'lodgingRoomTypes'] as const)) {
  @ApiProperty({
    description: 'Array of detailed room types for the lodging (with optional IDs for updates)',
    required: false,
    type: UpdateLodgingRoomTypeDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLodgingRoomTypeDto)
  lodgingRoomTypes?: UpdateLodgingRoomTypeDto[];
}
