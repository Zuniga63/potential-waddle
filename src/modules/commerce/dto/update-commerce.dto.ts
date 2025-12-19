import { OmitType, PartialType, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCommerceDto } from './create-commerce.dto';
import { UpdateCommerceProductDto } from './update-commerce-product.dto';

export class UpdateCommerceDto extends PartialType(OmitType(CreateCommerceDto, ['slug'] as const)) {
  @ApiProperty({
    description: 'Array of products for the commerce (with optional IDs for updates)',
    required: false,
    type: UpdateCommerceProductDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCommerceProductDto)
  commerceProducts?: UpdateCommerceProductDto[];
}
