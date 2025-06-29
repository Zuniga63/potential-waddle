import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAppIconDto {
  @ApiProperty({ example: 'Restaurant', description: 'The name of the icon' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'restaurant', description: 'The code of the icon' })
  @IsString()
  @IsNotEmpty()
  code: string;
}