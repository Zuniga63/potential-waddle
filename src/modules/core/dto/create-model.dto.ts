import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateModelDto {
  @ApiProperty({ example: 'Model name', description: 'The name of the model' })
  @MinLength(3)
  @IsString()
  name: string;
}
