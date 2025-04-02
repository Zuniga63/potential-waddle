import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePlaceDto } from './create-place.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePlaceDto extends PartialType(CreatePlaceDto) {
  @IsBoolean()
  @IsOptional()
  @ApiProperty({ description: 'Whether the place is public', required: false })
  showLocation?: boolean;
}
