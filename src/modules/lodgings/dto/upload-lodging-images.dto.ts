import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UploadLodgingImagesDto {
  @ApiProperty({
    description: 'The media format type',
    example: 'image',
    required: false,
    enum: ['image', 'video'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['image', 'video'])
  mediaFormat?: string;

  @ApiProperty({
    description: 'The video URL if media format is video',
    example: 'https://youtube.com/watch?v=123',
    required: false,
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;
}
