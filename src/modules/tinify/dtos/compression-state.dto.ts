import { ApiProperty } from '@nestjs/swagger';

export class CompressionStateDto {
  @ApiProperty()
  currentCompressions: number;

  @ApiProperty()
  maxCompressions: number;

  @ApiProperty()
  remainingCompressions: number;
}
