import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
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

  @ApiProperty({
    description:
      'Slugs of optional fields the owner explicitly marked "No tengo / No aplica" from the wizard. Persisted so the badge survives logout. Slugs match `OptionalFieldWithSkip.fieldName` on the frontend.',
    required: false,
    type: [String],
    example: ['facebook', 'instagram'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skippedOptionalFields?: string[];
}
