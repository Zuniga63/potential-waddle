import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../entities';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from '../dto';
import { GcpStorageService } from './gcp-storage.service';

@Injectable()
export class DocumentTypeService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
    private readonly gcpStorageService: GcpStorageService,
  ) {}

  async create(createDto: CreateDocumentTypeDto): Promise<DocumentType> {
    const documentType = this.documentTypeRepository.create(createDto);
    return this.documentTypeRepository.save(documentType);
  }

  async findAll(includeInactive = false): Promise<DocumentType[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.documentTypeRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DocumentType> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id },
    });

    if (!documentType) {
      throw new NotFoundException(`Document type with ID ${id} not found`);
    }

    return documentType;
  }

  async update(id: string, updateDto: UpdateDocumentTypeDto): Promise<DocumentType> {
    const documentType = await this.findOne(id);
    Object.assign(documentType, updateDto);
    return this.documentTypeRepository.save(documentType);
  }

  async remove(id: string): Promise<void> {
    const documentType = await this.findOne(id);
    await this.documentTypeRepository.remove(documentType);
  }

  async toggleActive(id: string): Promise<DocumentType> {
    const documentType = await this.findOne(id);
    documentType.isActive = !documentType.isActive;
    return this.documentTypeRepository.save(documentType);
  }

  async uploadTemplate(id: string, file: Express.Multer.File): Promise<DocumentType> {
    const documentType = await this.findOne(id);

    // Delete existing template if exists
    if (documentType.templateGcpPath) {
      try {
        await this.gcpStorageService.deleteFile(documentType.templateGcpPath);
      } catch (error) {
        // Ignore delete errors for old files
      }
    }

    // Upload new template
    const uploadResult = await this.gcpStorageService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      townSlug: 'templates',
      entityType: 'document-type',
      entityId: id,
    });

    // Update document type with template info
    documentType.templateUrl = uploadResult.publicUrl;
    documentType.templateFileName = uploadResult.fileName;
    documentType.templateGcpPath = uploadResult.gcpPath;

    return this.documentTypeRepository.save(documentType);
  }

  async deleteTemplate(id: string): Promise<DocumentType> {
    const documentType = await this.findOne(id);

    if (documentType.templateGcpPath) {
      await this.gcpStorageService.deleteFile(documentType.templateGcpPath);
    }

    documentType.templateUrl = null;
    documentType.templateFileName = null;
    documentType.templateGcpPath = null;

    return this.documentTypeRepository.save(documentType);
  }
}
