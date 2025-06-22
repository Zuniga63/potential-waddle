import { ApiProperty } from '@nestjs/swagger';
import { ImageResource } from '../entities';

export class ImageResourceDto {
  @ApiProperty({
    example: 'uuid',
    description: 'The ID of the image resource',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/v123/image.jpg',
    description: 'The URL of the image',
    readOnly: true,
  })
  url: string;

  @ApiProperty({
    example: 'image_public_id',
    description: 'The public ID from the cloud provider',
    readOnly: true,
  })
  publicId: string;

  @ApiProperty({
    example: 'image.jpg',
    description: 'The file name',
    readOnly: true,
  })
  fileName: string;

  @ApiProperty({
    example: 1920,
    description: 'The width of the image',
    readOnly: true,
  })
  width: number;

  @ApiProperty({
    example: 1080,
    description: 'The height of the image',
    readOnly: true,
  })
  height: number;

  @ApiProperty({
    example: 'jpg',
    description: 'The format of the image',
    readOnly: true,
  })
  format: string;

  @ApiProperty({
    example: 'image',
    description: 'The resource type',
    readOnly: true,
  })
  resourceType: string;

  @ApiProperty({
    example: 'cloudinary',
    description: 'The provider',
    readOnly: true,
  })
  provider: string;

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

  constructor(imageResource?: ImageResource) {
    if (!imageResource) return;

    this.id = imageResource.id;
    this.url = imageResource.url;
    this.publicId = imageResource.publicId || '';
    this.fileName = imageResource.fileName;
    this.width = imageResource.width || 0;
    this.height = imageResource.height || 0;
    this.format = imageResource.format || '';
    this.resourceType = imageResource.resourceType || '';
    this.provider = imageResource.provider || '';
    this.createdAt = imageResource.createdAt;
    this.updatedAt = imageResource.updatedAt;
  }
}