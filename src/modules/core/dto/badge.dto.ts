import { ApiProperty } from '@nestjs/swagger';
import { Badge } from '../entities';

export class BadgeDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd', readOnly: true })
  id: string;

  @ApiProperty({ example: 'Recomendado' })
  name: string;

  @ApiProperty({ example: 'recomendado' })
  slug: string;

  @ApiProperty({ example: 'Establecimiento recomendado por Binntu', required: false })
  description?: string;

  @ApiProperty({ example: 'IconStar', required: false })
  icon?: string;

  @ApiProperty({ example: '#FFD700', required: false })
  iconColor?: string;

  @ApiProperty({ example: '#FFF8E1', required: false })
  backgroundColor?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../badge.png', required: false })
  imageUrl?: string;

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;

  constructor(badge?: Badge) {
    if (!badge) return;

    this.id = badge.id;
    this.name = badge.name;
    this.slug = badge.slug;
    this.description = badge.description;
    this.icon = badge.icon;
    this.iconColor = badge.iconColor;
    this.backgroundColor = badge.backgroundColor;
    this.imageUrl = badge.imageUrl;
    this.isEnabled = badge.isEnabled;
    this.createdAt = badge.createdAt;
    this.updatedAt = badge.updatedAt;
  }
}
