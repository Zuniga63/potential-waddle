import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateRestaurantDto } from './create-restaurant.dto';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {
  @ApiProperty({
    description:
      'Owner-opt-out: when true, the Menú bucket is treated as satisfied without requiring uploaded menus (street food, informal establishments).',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  menuNotApplicable?: boolean;

  @ApiProperty({
    description:
      'Slugs of optional fields the owner marked "No tengo / No aplica" from the wizard. Persisted server-side. Mirror of UpdateLodgingDto.skippedOptionalFields.',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skippedOptionalFields?: string[];
}
