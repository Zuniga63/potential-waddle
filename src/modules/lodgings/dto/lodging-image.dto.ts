import { ApiProperty } from '@nestjs/swagger';
import { ImageResourceDto } from 'src/modules/core/dto';
import { LodgingImage } from '../entities';

export class LodgingImageDto {
  @ApiProperty({
    example: 'uuid',
    description: 'The ID of the lodging image',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    example: 1,
    description: 'The order of the image',
    readOnly: true,
  })
  order: number;

  @ApiProperty({
    example: true,
    description: 'Whether the image is public',
    readOnly: true,
  })
  isPublic: boolean;

  @ApiProperty({
    example: 'image',
    description: 'The media format (image or video)',
    readOnly: true,
  })
  mediaFormat: string;

  @ApiProperty({
    example: 'https://youtube.com/watch?v=123',
    description: 'The video URL if media format is video',
    readOnly: true,
    required: false,
  })
  videoUrl?: string;

  @ApiProperty({
    description: 'The image resource',
    readOnly: true,
    type: ImageResourceDto,
  })
  imageResource: ImageResourceDto;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'The creation date',
    readOnly: true,
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'The last update date',
    readOnly: true,
  })
  updatedAt: Date;

  constructor(lodgingImage?: LodgingImage) {
    if (!lodgingImage) return;

    this.id = lodgingImage.id;
    this.order = lodgingImage.order;
    this.isPublic = lodgingImage.isPublic;
    this.mediaFormat = lodgingImage.mediaFormat || 'image';
    this.videoUrl = lodgingImage.videoUrl;
    this.imageResource = new ImageResourceDto(lodgingImage.imageResource);
    this.createdAt = lodgingImage.createdAt;
    this.updatedAt = lodgingImage.updatedAt;
  }
} 