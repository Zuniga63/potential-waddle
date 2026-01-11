import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentType, TownDocumentRequirement, Document } from './entities';
import {
  GcpStorageService,
  DocumentTypeService,
  TownDocumentRequirementService,
  DocumentService,
} from './services';
import {
  DocumentTypeController,
  TownDocumentRequirementController,
  DocumentController,
} from './controllers';
import { Town } from '../towns/entities/town.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentType, TownDocumentRequirement, Document, Town]),
  ],
  controllers: [DocumentTypeController, TownDocumentRequirementController, DocumentController],
  providers: [
    GcpStorageService,
    DocumentTypeService,
    TownDocumentRequirementService,
    DocumentService,
  ],
  exports: [DocumentService, TownDocumentRequirementService, GcpStorageService],
})
export class DocumentsModule {}
