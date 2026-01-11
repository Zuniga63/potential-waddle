import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TownDocumentRequirement, DocumentType } from '../entities';
import {
  CreateTownDocumentRequirementDto,
  UpdateTownDocumentRequirementDto,
  BulkTownDocumentRequirementDto,
} from '../dto';
import { DocumentEntityType } from '../enums';

@Injectable()
export class TownDocumentRequirementService {
  constructor(
    @InjectRepository(TownDocumentRequirement)
    private readonly requirementRepository: Repository<TownDocumentRequirement>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) {}

  async create(createDto: CreateTownDocumentRequirementDto): Promise<TownDocumentRequirement> {
    const requirement = this.requirementRepository.create(createDto);
    return this.requirementRepository.save(requirement);
  }

  async findByTownAndEntityType(
    townId: string,
    entityType: DocumentEntityType,
  ): Promise<TownDocumentRequirement[]> {
    return this.requirementRepository.find({
      where: { townId, entityType },
      relations: ['documentType'],
      order: { documentType: { name: 'ASC' } },
    });
  }

  async findByTown(townId: string): Promise<TownDocumentRequirement[]> {
    return this.requirementRepository.find({
      where: { townId },
      relations: ['documentType'],
      order: { entityType: 'ASC', documentType: { name: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<TownDocumentRequirement> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: ['documentType'],
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    return requirement;
  }

  async update(id: string, updateDto: UpdateTownDocumentRequirementDto): Promise<TownDocumentRequirement> {
    const requirement = await this.findOne(id);
    Object.assign(requirement, updateDto);
    return this.requirementRepository.save(requirement);
  }

  async remove(id: string): Promise<void> {
    const requirement = await this.findOne(id);
    await this.requirementRepository.remove(requirement);
  }

  // Bulk update requirements for a town and entity type
  async bulkUpdate(bulkDto: BulkTownDocumentRequirementDto): Promise<TownDocumentRequirement[]> {
    const { townId, entityType, requirements } = bulkDto;

    // Delete existing requirements for this town and entity type
    await this.requirementRepository.delete({ townId, entityType });

    // Create new requirements
    const newRequirements = requirements.map((req) =>
      this.requirementRepository.create({
        townId,
        entityType,
        documentTypeId: req.documentTypeId,
        isRequired: req.isRequired,
      }),
    );

    return this.requirementRepository.save(newRequirements);
  }

  // Get all document types with their requirement status for a town and entity type
  async getRequirementsWithAllTypes(
    townId: string,
    entityType: DocumentEntityType,
  ): Promise<
    Array<{
      documentType: DocumentType;
      isConfigured: boolean;
      isRequired: boolean;
    }>
  > {
    const allDocumentTypes = await this.documentTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const requirements = await this.findByTownAndEntityType(townId, entityType);
    const requirementMap = new Map(requirements.map((r) => [r.documentTypeId, r]));

    return allDocumentTypes.map((docType) => {
      const requirement = requirementMap.get(docType.id);
      return {
        documentType: docType,
        isConfigured: !!requirement,
        isRequired: requirement?.isRequired ?? false,
      };
    });
  }
}
