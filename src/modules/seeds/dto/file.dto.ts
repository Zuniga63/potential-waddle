import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class FileDto {
  @IsNotEmpty({ message: 'Se requiere el archivo' })
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
