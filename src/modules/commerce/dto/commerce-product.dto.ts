import { ApiProperty } from '@nestjs/swagger';
import { CommerceProduct, CommerceProductType } from '../entities';

export class CommerceProductDto {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Type of product', example: 'product', enum: CommerceProductType })
  type: CommerceProductType;

  @ApiProperty({ description: 'Name of the product', example: 'Artesania local' })
  name: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'Hermosa artesania hecha a mano',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Price of the product', example: 25000 })
  price: number;

  @ApiProperty({ description: 'SKU or product code', example: 'ART-001', required: false })
  sku?: string;

  @ApiProperty({ description: 'Whether the product is available', example: true })
  isAvailable: boolean;

  @ApiProperty({ description: 'Stock quantity (for products)', example: 10, required: false })
  stock?: number;

  @ApiProperty({ description: 'Display order', example: 0 })
  order: number;

  @ApiProperty({ description: 'Whether the product is public', example: true })
  isPublic: boolean;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    description: 'List of image URLs for the product',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    required: false,
  })
  images?: string[];

  constructor(product?: CommerceProduct) {
    if (!product) return;

    this.id = product.id;
    this.type = product.type;
    this.name = product.name;
    this.description = product.description || undefined;
    this.price = product.price;
    this.sku = product.sku || undefined;
    this.isAvailable = product.isAvailable;
    this.stock = product.stock || undefined;
    this.order = product.order;
    this.isPublic = product.isPublic;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
    this.images = product.images?.sort((a, b) => a.order - b.order).map(image => image.imageResource.url) || [];
  }
}
