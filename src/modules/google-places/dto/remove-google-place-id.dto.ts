import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RemoveGooglePlaceIdDto {
  @ApiProperty({
    description: 'The place ID to remove',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  placeId: string;

  @ApiProperty({
    description: 'The model to remove the place ID from',
    example: 'commerce',
  })
  @IsString()
  @IsNotEmpty()
  model: string;
}
