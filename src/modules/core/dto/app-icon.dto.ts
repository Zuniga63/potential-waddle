import { ApiProperty } from '@nestjs/swagger';
import { AppIcon } from '../entities';

export class AppIconDto {
  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the icon',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    example: 'Spa',
    description: 'The name of the icon',
  })
  name: string;

  @ApiProperty({
    example: 'spa',
    description: 'The code of the icon',
  })
  code: string;

  constructor(icon?: AppIcon) {
    if (!icon) return;

    this.id = icon.id;
    this.name = icon.name;
    this.code = icon.code;
  }
}
