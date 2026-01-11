import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { DocumentCategory } from '../enums';

export class CreateDocumentTypeDto {
  @ApiProperty({ example: 'RUT', description: 'Name of the document type' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Registro Único Tributario', description: 'Description', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: DocumentCategory, example: DocumentCategory.LEGAL })
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiProperty({ example: true, description: 'Whether this document type has expiration' })
  @IsBoolean()
  hasExpiration: boolean;

  @ApiProperty({ example: true, description: 'Whether this document type is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDocumentTypeDto extends PartialType(CreateDocumentTypeDto) {}

export class DocumentTypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: DocumentCategory })
  category: DocumentCategory;

  @ApiProperty()
  hasExpiration: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
