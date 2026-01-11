import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { DocumentEntityType, DocumentStatus } from '../enums';

export class CreateDocumentDto {
  @ApiProperty({ example: 'uuid', description: 'Document Type ID' })
  @IsUUID()
  documentTypeId: string;

  @ApiProperty({ enum: DocumentEntityType, example: DocumentEntityType.LODGING })
  @IsEnum(DocumentEntityType)
  entityType: DocumentEntityType;

  @ApiProperty({ example: 'uuid', description: 'Entity ID (lodging, restaurant, etc.)' })
  @IsUUID()
  entityId: string;

  @ApiProperty({ example: '2025-12-31', description: 'Expiration date', required: false })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;
}

export class UpdateDocumentStatusDto {
  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.APPROVED })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiProperty({ example: 'Document is not legible', description: 'Rejection reason', required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentTypeId: string;

  @ApiProperty({ enum: DocumentEntityType })
  entityType: DocumentEntityType;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  expirationDate: Date | null;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty()
  rejectionReason: string | null;

  @ApiProperty()
  uploadedById: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  documentType?: {
    id: string;
    name: string;
    category: string;
    hasExpiration: boolean;
  };
}

// DTO for entity documents with requirements status
export class EntityDocumentStatusDto {
  @ApiProperty()
  documentType: {
    id: string;
    name: string;
    description: string;
    category: string;
    hasExpiration: boolean;
  };

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty()
  document: DocumentResponseDto | null;

  @ApiProperty()
  isUploaded: boolean;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  needsAttention: boolean;
}
