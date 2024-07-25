import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateLanguageDto {
  @ApiProperty({ example: 'Ingles Estados Unidos', description: 'The name of the model' })
  @MinLength(3)
  @IsString()
  name: string;

  @ApiProperty({ example: 'es-us', description: 'The languge code.' })
  @MinLength(2)
  @IsString()
  code: string;
}
