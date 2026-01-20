import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { TownImage } from '../entities/town-image.entity';

export class TownImageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isHero: boolean;

  @ApiPropertyOptional()
  heroPosition?: number;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  imageResource: {
    id: string;
    url: string;
    fileName: string;
    width?: number;
    height?: number;
  };

  @ApiProperty()
  createdAt: Date;

  constructor(townImage: TownImage) {
    this.id = townImage.id;
    this.order = townImage.order;
    this.isHero = townImage.isHero;
    this.heroPosition = townImage.heroPosition;
    this.isPublic = townImage.isPublic;
    this.createdAt = townImage.createdAt;

    if (townImage.imageResource) {
      this.imageResource = {
        id: townImage.imageResource.id,
        url: townImage.imageResource.url,
        fileName: townImage.imageResource.fileName,
        width: townImage.imageResource.width,
        height: townImage.imageResource.height,
      };
    }
  }
}

export class UpdateTownImageDto {
  @ApiPropertyOptional({
    description: 'Whether the image is part of the hero banner',
  })
  @IsOptional()
  @IsBoolean()
  isHero?: boolean;

  @ApiPropertyOptional({
    description: 'Position in the hero banner (1, 2 or 3)',
    minimum: 1,
    maximum: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  heroPosition?: number;

  @ApiPropertyOptional({
    description: 'Whether the image is public',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Order of the image in the gallery',
  })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class SetHeroImagesDto {
  @ApiProperty({
    description: 'Array of image IDs to set as hero images (max 3)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  imageIds: string[];
}

export class ReorderTownImagesDto {
  @ApiProperty({
    description: 'Array of objects with id and new order',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        order: { type: 'number' },
      },
    },
  })
  @IsArray()
  newOrder: { id: string; order: number }[];
}
