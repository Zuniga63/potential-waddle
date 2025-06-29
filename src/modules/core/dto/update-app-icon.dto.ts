import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAppIconDto } from './create-app-icon.dto';

export class UpdateAppIconDto extends PartialType(CreateAppIconDto) {
  @ApiProperty({ example: 'Restaurant', description: 'The name of the icon', required: false })
  name?: string;

  @ApiProperty({ example: 'restaurant', description: 'The code of the icon', required: false })
  code?: string;
}