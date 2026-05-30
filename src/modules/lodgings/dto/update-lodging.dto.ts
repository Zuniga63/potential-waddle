import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
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

  @ApiProperty({
    description:
      'Owner-opt-out flag: when true, the wizard treats the Rooms bucket as satisfied without requiring lodgingRoomTypes (apartments, whole-house rentals, hotels that prefer not to list types).',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  roomsNotApplicable?: boolean;
}
