import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCommerceProductDto } from './create-commerce-product.dto';

export class UpdateCommerceProductDto extends CreateCommerceProductDto {
  @ApiProperty({
    description: 'Unique identifier of the product (for updates)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  id?: string;
}
