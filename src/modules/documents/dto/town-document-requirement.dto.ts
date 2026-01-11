import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentEntityType } from '../enums';

export class CreateTownDocumentRequirementDto {
  @ApiProperty({ example: 'uuid', description: 'Town ID' })
  @IsUUID()
  townId: string;

  @ApiProperty({ example: 'uuid', description: 'Document Type ID' })
  @IsUUID()
  documentTypeId: string;

  @ApiProperty({ enum: DocumentEntityType, example: DocumentEntityType.LODGING })
  @IsEnum(DocumentEntityType)
  entityType: DocumentEntityType;

  @ApiProperty({ example: true, description: 'Whether this document is required' })
  @IsBoolean()
  isRequired: boolean;
}

export class UpdateTownDocumentRequirementDto extends PartialType(CreateTownDocumentRequirementDto) {}

// DTO for bulk configuration
export class BulkRequirementItemDto {
  @ApiProperty({ example: 'uuid', description: 'Document Type ID' })
  @IsUUID()
  documentTypeId: string;

  @ApiProperty({ example: true, description: 'Whether this document is required' })
  @IsBoolean()
  isRequired: boolean;
}

export class BulkTownDocumentRequirementDto {
  @ApiProperty({ example: 'uuid', description: 'Town ID' })
  @IsUUID()
  townId: string;

  @ApiProperty({ enum: DocumentEntityType, example: DocumentEntityType.LODGING })
  @IsEnum(DocumentEntityType)
  entityType: DocumentEntityType;

  @ApiProperty({ type: [BulkRequirementItemDto], description: 'List of document requirements' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkRequirementItemDto)
  requirements: BulkRequirementItemDto[];
}

export class TownDocumentRequirementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  townId: string;

  @ApiProperty()
  documentTypeId: string;

  @ApiProperty({ enum: DocumentEntityType })
  entityType: DocumentEntityType;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty()
  documentType?: {
    id: string;
    name: string;
    category: string;
    hasExpiration: boolean;
  };
}
