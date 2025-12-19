import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommerceProductType } from '../entities';

export class CreateCommerceProductDto {
  @ApiProperty({ description: 'Type of product', example: 'product', enum: CommerceProductType })
  @IsEnum(CommerceProductType)
  type: CommerceProductType;

  @ApiProperty({ description: 'Name of the product', example: 'Artesania local' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'Hermosa artesania hecha a mano',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the product', example: 25000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'SKU or product code', example: 'ART-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ description: 'Whether the product is available', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ description: 'Stock quantity (for products)', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ description: 'Display order', example: 0, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ description: 'Whether the product is public', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
