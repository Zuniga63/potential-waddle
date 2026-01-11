import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../entities';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from '../dto';

@Injectable()
export class DocumentTypeService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
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
}
