import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateBadgeDto {
  @ApiProperty({ example: 'Recomendado', description: 'The name of the badge' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'recomendado', description: 'The slug of the badge' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Establecimiento recomendado', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'IconStar', description: 'Icon name from tabler icons', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: '#FFD700', description: 'Icon color hex', required: false })
  @IsString()
  @IsOptional()
  iconColor?: string;

  @ApiProperty({ example: '#FFF8E1', description: 'Background color hex', required: false })
  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../badge.png', description: 'Badge image URL', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
